import { error, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import ProfileText from '$lib/locales/profile';
import getLanguageLabel from '$lib/utils/getLanguageLabel';
import type { Actions, PageServerLoad } from './$types';

export type CommentWithContent = {
	id: number;
	content_text: string | null;
	created_at: string;
	receive_notification: boolean;
	to_article: number | null;
	to_photo: number | null;
	to_thought: number | null;
	reply_to: {
		id: number;
		content_text: string | null;
	} | null;
	article: {
		title: string;
		slug: string;
		lang: number;
	} | null;
	photo: {
		title: string;
		slug: string;
		lang: number;
	} | null;
	thought: {
		content_text: string;
		slug: string;
	} | null;
};

/** 两个 action 返回同一种形状，页面里读 form.success / form.error 才不会被联合类型挡住 */
type ProfileActionData = {
	success?: string;
	error?: string;
};

const actionData = (data: ProfileActionData): ProfileActionData => data;

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = locals.supabase;
	const { session } = await locals.safeGetSession();
	const userId = params.id;

	// 检查是否登录
	if (!session) {
		redirect(303, `/${params.lang}/login`);
	}

	// 检查是否是用户自己的资料
	const isOwnProfile = session.user.id === userId;

	if (!isOwnProfile) {
		error(403, 'Unauthorized');
	}

	// 获取用户资料
	const { data: publicUser } = await supabase
		.from('users')
		.select('id, name, created_at, user_id')
		.eq('user_id', userId)
		.maybeSingle();

	if (!publicUser) {
		error(404, 'User not found');
	}

	// 从 session 中获取邮箱（用户已登录且只能查看自己的资料）
	const userProfile = {
		id: publicUser.id,
		name: publicUser.name,
		email: session.user.email || null,
		created_at: publicUser.created_at
	};

	// 获取用户的所有评论
	const { data: comments } = await supabase
		.from('comment')
		.select(
			`
      id,
      content_text,
      created_at,
      receive_notification,
      to_article,
      to_photo,
      to_thought,
      reply_to:reply_to (
        id,
        content_text
      )
    `
		)
		.eq('user_id', publicUser.id)
		.order('created_at', { ascending: false });

	// 为每个评论获取关联的内容
	const commentsWithContent = await Promise.all(
		(comments || []).map(async (comment) => {
			let article = null;
			let photo = null;
			let thought = null;

			if (comment.to_article) {
				const { data } = await supabase
					.from('article')
					.select('title, slug, lang')
					.eq('id', comment.to_article)
					.maybeSingle();
				article = data;
			} else if (comment.to_photo) {
				const { data } = await supabase
					.from('photo')
					.select('title, slug, lang')
					.eq('id', comment.to_photo)
					.maybeSingle();
				photo = data;
			} else if (comment.to_thought) {
				const { data } = await supabase
					.from('thought')
					.select('content_text, slug')
					.eq('id', comment.to_thought)
					.maybeSingle();
				thought = data;
			}

			return {
				...comment,
				article,
				photo,
				thought
			} as CommentWithContent;
		})
	);

	return {
		userProfile,
		comments: commentsWithContent,
		isOwnProfile
	};
};

/**
 * 两个 action 共用的前置校验：必须是本人、评论必须属于本人。
 * 旧版这段写在唯一那个 action 里，intent 分发之前。
 */
async function verifyOwnComment(
	supabase: SupabaseClient<Database>,
	sessionUserId: string | undefined,
	userId: string,
	commentId: number,
	label: { [key: string]: string }
): Promise<{ error: string } | { commentId: number }> {
	if (!sessionUserId || sessionUserId !== userId) {
		return { error: label.unauthorized };
	}

	// 获取用户的 public.users.id
	const { data: publicUser } = await supabase
		.from('users')
		.select('id')
		.eq('user_id', userId)
		.maybeSingle();

	if (!publicUser) {
		return { error: label.unauthorized };
	}

	// 验证评论属于当前用户
	const { data: comment } = await supabase
		.from('comment')
		.select('id, user_id')
		.eq('id', commentId)
		.maybeSingle();

	if (!comment || comment.user_id !== publicUser.id) {
		return { error: label.unauthorized };
	}

	return { commentId };
}

export const actions: Actions = {
	// 旧版是单个 action 用 intent 字段分发 delete / toggle_notification，这里拆成具名 action
	delete: async ({ request, locals, params }) => {
		const supabase = locals.supabase;
		const { session } = await locals.safeGetSession();
		const label = getLanguageLabel(ProfileText, params.lang);

		const formData = await request.formData();
		const commentId = parseInt(formData.get('commentId') as string, 10);

		const verified = await verifyOwnComment(
			supabase,
			session?.user.id,
			params.id,
			commentId,
			label
		);

		if ('error' in verified) {
			return actionData({ error: verified.error });
		}

		// 删除评论
		const { error: deleteError } = await supabase
			.from('comment')
			.delete()
			.eq('id', verified.commentId);

		if (deleteError) {
			console.error('Failed to delete comment:', deleteError);
			return actionData({ error: label.delete_error });
		}

		return actionData({ success: label.delete_success });
	},

	toggleNotification: async ({ request, locals, params }) => {
		const supabase = locals.supabase;
		const { session } = await locals.safeGetSession();
		const label = getLanguageLabel(ProfileText, params.lang);

		const formData = await request.formData();
		const commentId = parseInt(formData.get('commentId') as string, 10);

		const verified = await verifyOwnComment(
			supabase,
			session?.user.id,
			params.id,
			commentId,
			label
		);

		if ('error' in verified) {
			return actionData({ error: verified.error });
		}

		// 切换通知设置
		const currentValue = formData.get('currentValue') === 'true';
		const { error: updateError } = await supabase
			.from('comment')
			.update({ receive_notification: !currentValue })
			.eq('id', verified.commentId);

		if (updateError) {
			console.error('Failed to update notification:', updateError);
			return actionData({ error: label.update_error });
		}

		return actionData({ success: label.update_success });
	}
};

import { generateUnsubscribeToken } from '@darmau/shared/unsubscribe-token';
import type { Env } from '../env';
import { sendEmail } from '../lib/email';
import { fail, json, skip } from '../lib/http';
import { createServiceClient, type Client } from '../lib/supabase';
import type { WebhookPayload } from '../lib/webhook';
import { renderCommentReplyMail } from '../templates/commentReply';

interface CommentRecord {
	id: number;
	reply_to: number | null;
	content_text: string;
	is_public?: boolean | null;
	user_id?: number | null;
	language?: string | null;
	to_article?: number | null;
	to_photo?: number | null;
	to_thought?: number | null;
}

interface ReplyToComment {
	id: number;
	content_text: string;
	receive_notification: boolean;
	email?: string | null; // 匿名评论才有
	name?: string | null; // 匿名评论才有
	user_id?: number | null; // 登录用户评论才有
}

/** 内容表 → 前台 URL 里的路径段 */
const TYPE_TO_URL_SEGMENT: Record<string, string> = {
	article: 'article',
	photo: 'album',
	thought: 'thought'
};

export async function handleSendMail(request: Request, env: Env): Promise<Response> {
	const payload = (await request.json()) as WebhookPayload<CommentRecord>;

	if (!payload.type || !payload.record) {
		return fail('Invalid payload format. Expected type and record.', 400);
	}

	const comment = payload.record;
	const oldComment = payload.old_record ?? undefined;
	const isPublic = comment.is_public ?? false;
	const userId = comment.user_id ?? null;

	// INSERT 只处理"登录用户发的、且直接公开"的评论；匿名评论要等审核通过走 UPDATE
	if (payload.type === 'INSERT' && (!userId || !isPublic)) {
		return skip('Skip insert: comment not public by user');
	}

	// UPDATE 只在 is_public 由 false 变 true 的那一次发信，避免重复通知
	if (payload.type === 'UPDATE') {
		const wasPublic = oldComment?.is_public ?? false;
		if (!(wasPublic === false && isPublic === true)) {
			return skip('Skip update: comment not newly public');
		}
	}

	if (!comment.reply_to) return skip('Root comment, no notification needed');

	const supabase = createServiceClient(env);

	const { data: replyToComment, error: replyToError } = await supabase
		.from('comment')
		.select('id, content_text, receive_notification, email, name, user_id')
		.eq('id', comment.reply_to)
		.single();

	if (replyToError) {
		return fail('Reply-to comment query failed', 500, replyToError.message);
	}
	if (!replyToComment) return fail('Reply-to comment not found', 404);

	const replyTo = replyToComment as unknown as ReplyToComment;
	if (!replyTo.receive_notification) return skip('User disabled notifications');

	const target = resolveTarget(comment);
	if (!target) return fail('No target content found', 400);

	// thought 表没有 title / language 关联，单独取列
	const selectColumns =
		target.type === 'thought' ? 'slug, content_text' : 'slug, title, content_text, language(lang)';

	const { data: targetContent, error: targetError } = await supabase
		// 表名是运行时才确定的，生成的 Database 类型无法表达这种动态查询
		.from(target.type as 'article')
		.select(selectColumns)
		.eq('id', target.id)
		.single();

	if (targetError) return fail('Target content query failed', 500, targetError.message);
	if (!targetContent) return fail('Target content not found', 404);

	const content = targetContent as unknown as {
		slug: string;
		title?: string | null;
		language?: { lang: string } | null;
	};

	const lang = target.type === 'thought' ? (comment.language ?? 'zh') : content.language?.lang;
	if (!lang) return fail('Language not found', 404);

	const recipient = await resolveRecipient(supabase, replyTo);
	if ('error' in recipient) return fail(recipient.error, recipient.status);

	const token = await generateUnsubscribeToken(replyTo.id, env.UNSUBSCRIBE_KEY);
	const title = content.title || '一条想法下';

	const { html, text } = renderCommentReplyMail({
		name: recipient.name,
		lang,
		urlType: TYPE_TO_URL_SEGMENT[target.type]!,
		slug: content.slug,
		title,
		originalComment: replyTo.content_text,
		newComment: comment.content_text,
		siteUrl: env.SITE_URL,
		unsubscribeToken: token
	});

	const messageId = await sendEmail(env, {
		to: recipient.email,
		subject: `你收到了一条新的评论回复 - ${title}`,
		html,
		text
	});

	return json({ success: true, message: 'Email sent successfully', messageId });
}

function resolveTarget(comment: CommentRecord): { type: string; id: number } | null {
	if (comment.to_article) return { type: 'article', id: comment.to_article };
	if (comment.to_photo) return { type: 'photo', id: comment.to_photo };
	if (comment.to_thought) return { type: 'thought', id: comment.to_thought };
	return null;
}

async function resolveRecipient(
	supabase: Client,
	replyTo: ReplyToComment
): Promise<{ name: string; email: string } | { error: string; status: number }> {
	// 匿名评论：name / email 直接存在 comment 行上
	if (!replyTo.user_id) {
		if (!replyTo.name || !replyTo.email) return { error: 'Anonymous commenter has no email', status: 404 };
		return { name: replyTo.name, email: replyTo.email };
	}

	// 登录用户：名字在 users 表，邮箱要走 auth admin API
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('name, user_id')
		.eq('id', replyTo.user_id)
		.single();

	if (userError || !userData) return { error: 'User not found', status: 404 };
	// users.user_id 是关联 auth.users 的 UUID，理论上不会为空，但类型上允许
	if (!userData.user_id) return { error: 'User has no auth account', status: 404 };

	const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
		userData.user_id
	);

	if (authError || !authUser.user?.email) return { error: 'User email not found', status: 404 };

	return { name: userData.name ?? '', email: authUser.user.email };
}

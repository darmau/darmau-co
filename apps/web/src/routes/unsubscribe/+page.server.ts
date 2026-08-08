import { verifyUnsubscribeToken } from '@darmau/shared/unsubscribe-token';
import type { Actions, PageServerLoad } from './$types';

type UnsubscribeLoaderData = {
	valid: boolean;
	commentId: number | null;
	error?: string;
};

type UnsubscribeActionData = {
	success: boolean;
	error?: string;
};

// 各分支返回的键不一样，统一成一个声明类型，页面里才好读 data.error / form.error
const loaderData = (data: UnsubscribeLoaderData): UnsubscribeLoaderData => data;
const actionData = (data: UnsubscribeActionData): UnsubscribeActionData => data;

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return loaderData({
			valid: false,
			commentId: null,
			error: '缺少取消订阅令牌'
		});
	}

	// 使用环境变量中的密钥验证 token。
	// 旧版这里读的是 RESEND_KEY（还带一个 "fallback-secret-key" 兜底），
	// 但 notifier 生成 token 用的是 UNSUBSCRIBE_KEY，用 RESEND_KEY 验签必然失败，
	// 这是旧代码的 bug，改成和 /[lang]/unsubscribe 一致的 UNSUBSCRIBE_KEY。
	const secret = platform?.env?.UNSUBSCRIBE_KEY ?? '';
	const commentId = await verifyUnsubscribeToken(token, secret);

	if (!commentId) {
		return loaderData({
			valid: false,
			commentId: null,
			error: '令牌无效或已过期'
		});
	}

	// 不再回查 comment：anon 读不到 receive_notification（列级 GRANT，42501），
	// 待审核评论对 anon 也不可见，查了会把合法链接误判成“评论不存在”。
	return loaderData({
		valid: true,
		commentId
	});
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const commentId = formData.get('commentId');

		if (!commentId || typeof commentId !== 'string') {
			return actionData({
				success: false,
				error: '缺少评论 ID'
			});
		}

		// 更新评论的 receive_notification 字段。
		// count 用来分辨“真的改了”和“RLS 挡掉、0 行受影响”，后者不会报错。
		const { error, count } = await locals.supabase
			.from('comment')
			.update({ receive_notification: false }, { count: 'exact' })
			.eq('id', parseInt(commentId, 10));

		if (error || !count) {
			console.error('Failed to unsubscribe:', error ?? `0 rows affected for comment ${commentId}`);
			return actionData({
				success: false,
				error: '取消订阅失败，请稍后重试'
			});
		}

		return actionData({
			success: true
		});
	}
};

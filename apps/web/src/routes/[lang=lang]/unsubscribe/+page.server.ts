import { verifyUnsubscribeToken } from '@darmau/shared/unsubscribe-token';
import UnsubscribeText from '$lib/locales/unsubscribe';
import getLanguageLabel from '$lib/utils/getLanguageLabel';
import type { Actions, PageServerLoad } from './$types';

type UnsubscribeLoaderData = {
	// "already"（此前已退订）需要回读 receive_notification 才能判断，
	// 而该列对 anon 已不可读，因此这个状态不再产生
	state: 'error' | 'ready';
	message?: string;
	token?: string;
	availableLangs: string[];
	baseUrl: string;
	lang: string;
};

type UnsubscribeActionData = {
	success: boolean;
	error?: string;
};

// 各分支返回的键不一样，不统一成一个声明类型的话 data / form 会变成字面量联合，
// 页面里读 data.token、form.error 会被类型挡住
const loaderData = (data: UnsubscribeLoaderData): UnsubscribeLoaderData => data;
const actionData = (data: UnsubscribeActionData): UnsubscribeActionData => data;

const AVAILABLE_LANGS = ['zh', 'en', 'jp'];

export const load: PageServerLoad = async ({ url, params, platform }) => {
	// [lang=lang] 的 matcher 已经保证语言合法，旧版那句 includes 判断删掉了
	const lang = params.lang;
	const labels = getLanguageLabel(UnsubscribeText, lang);
	const runtimeEnv = platform?.env;
	const baseUrl = runtimeEnv?.BASE_URL ?? '';

	const token = url.searchParams.get('token');

	if (!token) {
		return loaderData({
			state: 'error',
			message: labels.error_missing_token,
			availableLangs: AVAILABLE_LANGS,
			baseUrl,
			lang
		});
	}

	const secret = runtimeEnv?.UNSUBSCRIBE_KEY;

	if (!secret) {
		return loaderData({
			state: 'error',
			message: labels.error_config,
			availableLangs: AVAILABLE_LANGS,
			baseUrl,
			lang
		});
	}

	const commentId = await verifyUnsubscribeToken(token, secret);

	if (!commentId) {
		return loaderData({
			state: 'error',
			message: labels.error_invalid_token,
			availableLangs: AVAILABLE_LANGS,
			baseUrl,
			lang
		});
	}

	// 这里不再回查 comment：2026-08-07 起 anon 读不到 receive_notification 列
	// （列级 GRANT，会直接 42501），而且待审核的评论对 anon 根本不可见，
	// 查了只会把合法链接误判成“评论不存在”。token 有效即展示确认按钮，
	// 真正的幂等性交给 action 里的更新去保证。
	return loaderData({
		state: 'ready',
		token,
		availableLangs: AVAILABLE_LANGS,
		baseUrl,
		lang
	});
};

export const actions: Actions = {
	default: async ({ request, params, locals, platform }) => {
		const lang = params.lang;
		const labels = getLanguageLabel(UnsubscribeText, lang);

		const formData = await request.formData();
		const token = formData.get('token');

		if (!token || typeof token !== 'string') {
			return actionData({
				success: false,
				error: labels.error_missing_token
			});
		}

		const secret = platform?.env?.UNSUBSCRIBE_KEY;

		if (!secret) {
			return actionData({
				success: false,
				error: labels.error_config
			});
		}

		const commentId = await verifyUnsubscribeToken(token, secret);

		if (!commentId) {
			return actionData({
				success: false,
				error: labels.error_invalid_token
			});
		}

		// count 用来分辨“更新成功”和“RLS 把行挡掉了、一行都没改”——
		// 后者不报错，只返回 0 行，不检查的话会给访客一个假的成功提示。
		const { error, count } = await locals.supabase
			.from('comment')
			.update({ receive_notification: false }, { count: 'exact' })
			.eq('id', commentId);

		if (error) {
			console.error('Failed to unsubscribe comment notifications:', error);
			return actionData({
				success: false,
				error: labels.error_generic
			});
		}

		if (!count) {
			console.error('Unsubscribe affected 0 rows (RLS?) for comment', commentId);
			return actionData({
				success: false,
				error: labels.error_generic
			});
		}

		return actionData({
			success: true
		});
	}
};

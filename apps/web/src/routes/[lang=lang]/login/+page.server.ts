import { fail, redirect } from '@sveltejs/kit';
import SignupText from '$lib/locales/signup';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, params, locals, platform }) => {
	const origin = url.origin;
	const lang = params.lang;
	const next = url.searchParams.get('next') ?? `/${lang}`;

	const availableLangs = ['zh', 'en', 'jp'];

	// 检查用户是否已登录
	const { session } = await locals.safeGetSession();

	// 如果已登录，重定向到目标页面或首页
	if (session?.user) {
		redirect(303, next);
	}

	return {
		origin,
		baseUrl: platform?.env?.BASE_URL ?? '',
		availableLangs,
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	/**
	 * EmailLogin 组件自带 `<form method="POST" action="?/login">`，字段是
	 * email / lang / intent=email。
	 *
	 * 旧版还用同一个 action 处理 intent=github（服务端换 OAuth URL 再 302），
	 * 现在 GithubLogin 是纯客户端的，所以 intent 分发和结尾的
	 * `throw new Response("Unknown intent")` 一起去掉了。
	 */
	login: async ({ request, url, params, locals }) => {
		const formData = await request.formData();
		const rawLang = (formData.get('lang') as string | null)?.trim();
		const lang = rawLang?.length ? rawLang : params.lang;
		// 注意：表单 action 是 `?/login`，浏览器解析相对 URL 时会把页面原有的查询串
		// 整个换掉，所以这里读不到进入登录页时带的 ?next=。拿不到就回落到语言首页，
		// 和旧版没有 next 参数时的行为一致。
		const next = url.searchParams.get('next') ?? `/${lang}`;

		const email = (formData.get('email') as string | null)?.trim();
		const labels = SignupText[lang as keyof typeof SignupText] ?? SignupText.zh;

		if (!email) {
			return fail(400, { success: false, error: labels.email_required });
		}

		const emailRedirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;

		// 允许所有用户（新老用户）发送 magic link
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo,
				shouldCreateUser: true // 允许新用户创建账户
			}
		});

		if (error) {
			console.error(error);
			return fail(400, { success: false, error: error.message });
		}

		return { success: true, error: null };
	}
};

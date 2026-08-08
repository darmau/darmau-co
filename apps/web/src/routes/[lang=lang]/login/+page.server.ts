import { fail, redirect } from '@sveltejs/kit';
import SignupText from '$lib/locales/signup';
import { checkRateLimit } from '$lib/server/rateLimit';
import { safeRedirect } from '$lib/utils/safeUrl';
import { LOCALES } from '../../../params/lang';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, params, locals, platform }) => {
	const origin = url.origin;
	const lang = params.lang;
	// 登录后回跳的目标只允许站内路径，否则 `?next=//evil.com` 就是开放重定向
	const next = safeRedirect(url.searchParams.get('next'), `/${lang}`);

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
	login: async ({ request, url, params, locals, platform }) => {
		const formData = await request.formData();
		const rawLang = (formData.get('lang') as string | null)?.trim();
		// lang 来自表单，会被拼进 next 路径，必须按语言白名单收下，
		// 否则 `lang=//evil.com` 会经由 next 流进 emailRedirectTo。
		const lang =
			rawLang && (LOCALES as readonly string[]).includes(rawLang) ? rawLang : params.lang;
		// 注意：表单 action 是 `?/login`，浏览器解析相对 URL 时会把页面原有的查询串
		// 整个换掉，所以这里读不到进入登录页时带的 ?next=。拿不到就回落到语言首页，
		// 和旧版没有 next 参数时的行为一致。
		const next = safeRedirect(url.searchParams.get('next'), `/${lang}`);

		const email = (formData.get('email') as string | null)?.trim();
		const labels = SignupText[lang as keyof typeof SignupText] ?? SignupText.zh;

		if (!email) {
			return fail(400, { success: false, error: labels.email_required });
		}

		// 这个 action 会真的往任意地址发邮件，是最容易被拿来做邮件轰炸的入口
		if (!(await checkRateLimit(platform, 'RL_LOGIN', request))) {
			return fail(429, { success: false, error: labels.rate_limited });
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
			// 不要把 Supabase 的原始错误回给前端：它会区分"邮箱不存在"、
			// "该邮箱已被限流"等情况，等于给攻击者一个账号枚举预言机。
			console.error('signInWithOtp failed:', error);
			return fail(400, { success: false, error: labels.send_failed });
		}

		return { success: true, error: null };
	}
};

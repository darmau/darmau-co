import { redirect } from '@sveltejs/kit';
import { safeRedirect } from '$lib/utils/safeUrl';
import type { RequestHandler } from './$types';

const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function deriveLangFromPath(path: string): SupportedLang {
	const segments = path.split('/').filter(Boolean);
	const candidate = segments[0];
	if (candidate && SUPPORTED_LANGS.includes(candidate as SupportedLang)) {
		return candidate as SupportedLang;
	}
	return 'zh';
}

/**
 * OAuth / magic link 回调。原版自己 new 一个 supabase 客户端，把 setAll 收到的 cookie
 * 手工 append 成 Set-Cookie header 再塞进 redirect()。SvelteKit 这边 locals.supabase 的
 * cookie 写入走 event.cookies，重定向响应会自动带上，所以那套手工拼 header 的代码全部删掉，
 * 否则同一个 cookie 会被设置两次。
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	// next 直接来自查询串，不校验就是开放重定向：`?next=//evil.com` 会被浏览器
	// 当成协议相对 URL 跳去外站，把 OAuth 回调变成钓鱼跳板。
	const next = safeRedirect(url.searchParams.get('next'), '/');
	const errorDescription = url.searchParams.get('error_description') ?? undefined;

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			redirect(303, next);
		}

		redirect(
			303,
			`/auth/auth-code-error?next=${encodeURIComponent(next)}&reason=${encodeURIComponent(
				error.message ?? 'exchange_failed'
			)}`
		);
	}

	const lang = deriveLangFromPath(next);
	const reason =
		errorDescription ??
		url.searchParams.get('error') ??
		url.searchParams.get('message') ??
		'unknown';

	redirect(
		303,
		`/auth/auth-code-error?next=${encodeURIComponent(next)}&reason=${encodeURIComponent(reason)}&lang=${lang}`
	);
};

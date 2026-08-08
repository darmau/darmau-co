import NavbarItems from '$lib/locales/navbar';
import FooterText from '$lib/locales/footer';
import getFooterLabels from '$lib/utils/getFooterLabels';
import { LOCALES } from '../params/lang';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals, platform, depends }) => {
	// 登录状态变化时由 +layout.svelte 手动 invalidate
	depends('supabase:auth');

	const segment = url.pathname.split('/')[1];
	const lang = (LOCALES as readonly string[]).includes(segment) ? segment : 'zh';

	const env = platform?.env;

	const { session } = await locals.safeGetSession();

	return {
		lang,
		baseUrl: url.origin,
		// 需要下发到浏览器的运行时变量。仓库公开，所以只有这几个公开值可以出现在
		// 客户端，其余（TURNSTILE_SECRET_KEY、UNSUBSCRIBE_KEY 等）只能留在服务端。
		env: {
			SUPABASE_URL: env?.SUPABASE_URL ?? '',
			SUPABASE_ANON_KEY: env?.SUPABASE_ANON_KEY ?? '',
			PREFIX: env?.IMG_PREFIX ?? '',
			TURNSTILE_SITE_KEY: env?.TURNSTILE_SITE_KEY ?? ''
		},
		session,
		currentYear: new Date().getFullYear(),
		navbarItems: NavbarItems(lang),
		footerItems: getFooterLabels(FooterText, lang)
	};
};

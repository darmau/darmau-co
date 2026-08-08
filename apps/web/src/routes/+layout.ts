import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import type { Database } from '@darmau/database';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	// 浏览器端拿到的是真客户端（带 cookie 读写）；SSR 期间用一个只读 cookie 的
	// 服务端客户端占位，保证组件里 getSiteContext().supabase 永远不是 undefined。
	const supabase = isBrowser()
		? createBrowserClient<Database>(data.env.SUPABASE_URL, data.env.SUPABASE_ANON_KEY, {
				global: { fetch },
				cookieOptions: {
					maxAge: 60 * 60 * 24 * 14,
					path: '/',
					sameSite: 'lax'
				}
			})
		: createServerClient<Database>(data.env.SUPABASE_URL, data.env.SUPABASE_ANON_KEY, {
				global: { fetch },
				cookies: { getAll: () => [] }
			});

	return { ...data, supabase };
};

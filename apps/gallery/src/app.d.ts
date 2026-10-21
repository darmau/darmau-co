import type { Lang, Dict } from '$lib/i18n';

declare global {
	namespace App {
		interface Platform {
			// 全部是运行时变量：线上 `wrangler secret put`，本地 .dev.vars
			env: {
				SUPABASE_URL: string;
				SUPABASE_ANON_KEY: string;
				IMG_PREFIX: string;
				MAPBOX_TOKEN: string;
				BASE_URL: string;
				ASSETS: Fetcher;
			};
			cf?: CfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
		interface Locals {
			lang: Lang;
		}
		interface PageData {
			lang: Lang;
			t: Dict;
		}
	}
}

export {};

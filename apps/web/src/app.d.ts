import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			/** 每个请求只解析一次，见 hooks.server.ts */
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session: Session | null;
		}
		interface Platform {
			// wrangler.jsonc 里的绑定 + `wrangler secret put` 设的运行时变量，
			// 类型由 `pnpm typegen`（wrangler types）生成到 worker-configuration.d.ts
			env: Env & {
				/** 只在 notifier 侧必需，web 这边是可选的 */
				RESEND_KEY?: string;
			};
			cf?: CfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
	}
}

export {};

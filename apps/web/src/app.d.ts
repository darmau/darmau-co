import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import type { RateLimiter } from '$lib/server/rateLimit';

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
				// wrangler.jsonc 的 unsafe.bindings 不会被 `wrangler types` 生成，
				// 只能手写。dev 下没有 Workers 运行时，所以都是可选的。
				RL_TRANSLATE?: RateLimiter;
				RL_SEARCH?: RateLimiter;
				RL_LOGIN?: RateLimiter;
				RL_COMMENT?: RateLimiter;
			};
			cf?: CfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
	}
}

export {};

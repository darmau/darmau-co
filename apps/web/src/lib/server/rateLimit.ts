import { getClientIp } from './getClientIp';

/**
 * 公网可触发的写入 / 计算型端点的限流。
 *
 * 用 Cloudflare 原生的 Rate Limiting 绑定（wrangler.jsonc 里的 `unsafe.bindings`），
 * 不额外引入 KV 或 Durable Object：计数在边缘就地完成，没有额外往返，也不用自己
 * 处理过期。绑定在 wrangler.jsonc 里声明配额，这里只负责取 key 和判定。
 *
 * 注意配额是「每个 Worker 实例分区计数」的近似值，不是全局精确计数。目的是压掉
 * 自动化滥用（刷 AI 额度、刷登录邮件），不是精确计费。
 */

/** Workers Rate Limiting 绑定的最小接口，避免依赖生成的类型 */
export type RateLimiter = {
	limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

export type RateLimitBindingName = 'RL_TRANSLATE' | 'RL_SEARCH' | 'RL_LOGIN' | 'RL_COMMENT';

type PlatformLike = Readonly<{ env?: Record<string, unknown> }> | null | undefined;

/**
 * 按客户端 IP 限流。
 *
 * 取不到 IP 时（本地 dev、异常代理）退化成一个共享 key：宁可让这些请求彼此
 * 竞争同一个配额，也不要因为拿不到 IP 就直接放行。
 *
 * 绑定不存在时放行并告警——本地 `vite dev` 没有 Workers 运行时，
 * 不能让整个功能在开发环境里不可用。
 */
export async function checkRateLimit(
	platform: PlatformLike,
	binding: RateLimitBindingName,
	request: Request
): Promise<boolean> {
	const limiter = platform?.env?.[binding] as RateLimiter | undefined;

	if (!limiter || typeof limiter.limit !== 'function') {
		console.warn(`Rate limit binding ${binding} unavailable; request allowed through`);
		return true;
	}

	const key = getClientIp(request) ?? 'unknown-ip';

	try {
		const { success } = await limiter.limit({ key: `${binding}:${key}` });
		return success;
	} catch (error) {
		// 限流器本身故障不应该让功能整体不可用
		console.error(`Rate limit check failed for ${binding}:`, error);
		return true;
	}
}

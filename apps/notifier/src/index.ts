import type { Env } from './env';
import { handleBark } from './handlers/bark';
import { handleIpInfo } from './handlers/ipInfo';
import { handleSendMail } from './handlers/sendMail';
import { fail, isAuthorized, json } from './lib/http';

type Handler = (request: Request, env: Env) => Promise<Response>;

/**
 * 路由名沿用原来 Supabase Edge Function 的函数名，
 * 这样 Supabase 那边的 Database Webhook / 触发器只需要换 URL 前缀。
 */
const ROUTES: Record<string, Handler> = {
	'/send-mail': handleSendMail,
	'/bark': handleBark,
	'/ip-info': handleIpInfo
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname === '/health') return json({ ok: true });

		const handler = ROUTES[pathname];
		if (!handler) return fail('Not found', 404);
		if (request.method !== 'POST') return fail('Method not allowed', 405);

		if (!(await isAuthorized(request, env.WEBHOOK_SECRET))) {
			return fail('Unauthorized', 401);
		}

		try {
			return await handler(request, env);
		} catch (error) {
			console.error(`${pathname} 处理失败:`, error);
			return fail(
				'Internal server error',
				500,
				error instanceof Error ? error.message : String(error)
			);
		}
	}
} satisfies ExportedHandler<Env>;

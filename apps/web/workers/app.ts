import type { ServerBuild } from 'react-router';
import { createRequestHandler } from 'react-router';
// React Router 的 SSR 产物（`react-router build` 生成），由 wrangler 打包进 Worker。
// 这个目录是构建产物，所以 typecheck 必须排在 build 之后跑（见 apps/web/turbo.json）。
import * as serverBuild from '../build/server';

const handler = createRequestHandler(serverBuild as unknown as ServerBuild, 'production');

export default {
	fetch(request, env, ctx) {
		// context 的形状要和 dev 环境下 cloudflareDevProxy() 提供的 PlatformProxy 对齐，
		// 见 load-context.ts。应用里实际只用到 context.cloudflare.env。
		return handler(request, {
			cloudflare: {
				env,
				ctx,
				cf: request.cf,
				caches
			}
		} as never);
	}
} satisfies ExportedHandler<Env>;

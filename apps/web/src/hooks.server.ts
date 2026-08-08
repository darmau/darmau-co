import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import { getLang, toBcp47 } from '$lib/utils/getLang';
import { LOCALES } from './params/lang';

// 这些一级路径存在多语言版本。不在列表里的（auth、api、unsubscribe、sitemap 等）
// 保持原样，不做语言前缀重定向。
const MULTI_LANG_CONTENT = [
	'',
	'article',
	'articles',
	'album',
	'albums',
	'thoughts',
	'thought',
	'about',
	'contact',
	'site',
	'rss',
	'signup',
	'login',
	'book',
	'terms-of-use'
];

const isLocale = (value: string): boolean => (LOCALES as readonly string[]).includes(value);

/**
 * 语言前缀重定向。所有页面路由都挂在 `[lang=lang]/` 下，没有前缀的请求匹配不到任何路由，
 * 所以必须在 hooks 里先补上前缀——这是原 React Router 版本放在根 loader 里的逻辑。
 */
const language: Handle = async ({ event, resolve }) => {
	const segment = event.url.pathname.split('/')[1];

	if (!isLocale(segment) && MULTI_LANG_CONTENT.includes(segment)) {
		// 307 而不是 302：保留请求方法，避免 POST 被降级成 GET
		redirect(307, `/${getLang(event.request)}${event.url.pathname}${event.url.search}`);
	}

	// app.html 里的 <html lang="%lang%">。非内容路由（/auth/* 等）没有语言段，
	// 用协商结果兜底，而不是把路径片段原样塞进 lang 属性。
	const segmentLang = isLocale(segment) ? segment : getLang(event.request);
	// 路径段 jp 不是合法语言代码，lang 属性要发 ja，和 hreflang 保持一致
	const lang = toBcp47(segmentLang);

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};

const supabase: Handle = async ({ event, resolve }) => {
	// 仓库是公开的，密钥全部走 wrangler secret / .dev.vars，因此只能在运行时从
	// platform.env 读，不能用 $env/static/public（那是 cms 的做法）。
	const env = event.platform?.env;

	const client = createServerClient<Database>(env?.SUPABASE_URL ?? '', env?.SUPABASE_ANON_KEY ?? '', {
		cookieOptions: {
			maxAge: 60 * 60 * 24 * 14,
			path: '/',
			sameSite: 'lax'
		},
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.supabase = client;

	// 每个请求只解析一次：根 layout 和页面 load 都会问一次 session，
	// 不缓存的话每次页面加载都有多趟 getUser() 网络往返。
	let sessionPromise: Promise<{ session: Session | null; user: User | null }> | null = null;

	const resolveSession = async () => {
		try {
			const {
				data: { user },
				error
			} = await client.auth.getUser();

			if (error) {
				// 未登录（没 cookie / token 过期）是这个公开站点的常态，不值得记日志；
				// 其余错误意味着 Supabase 侧出了问题，静默吞掉会很难排查。
				if (error.status !== 401 && error.status !== 403) {
					console.error('[auth] getUser failed:', error.message);
				}
				return { session: null, user: null };
			}

			if (!user) return { session: null, user: null };

			const {
				data: { session }
			} = await client.auth.getSession();

			return { session, user };
		} catch (err) {
			console.error('[auth] session resolution threw:', err);
			return { session: null, user: null };
		}
	};

	event.locals.safeGetSession = () => {
		sessionPromise ??= resolveSession();
		return sessionPromise;
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

export const handle: Handle = sequence(language, supabase);

/**
 * 未捕获异常兜底。返回的 message 会成为 +error.svelte 里的 page.error.message，
 * 而那个页面刻意不展示它——内部消息是给日志看的，访客只该看到本地化的通用文案。
 */
export const handleError: HandleServerError = ({ error, status, message }) => {
	// 404 是正常流量（爬虫、旧链接），不值得记
	if (status !== 404) {
		console.error('[unhandled]', error);
	}
	return { message };
};

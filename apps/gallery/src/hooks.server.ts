import { redirect, type Handle } from '@sveltejs/kit';
import { BCP47, toLang } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	// 中文是无前缀的默认语言，/zh/... 统一 301 到无前缀版本，避免两个 URL 指向同一内容
	if (pathname === '/zh' || pathname.startsWith('/zh/')) {
		redirect(301, `${pathname.slice(3) || '/'}${search}`);
	}

	const lang = toLang(pathname.split('/')[1]);
	event.locals.lang = lang;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', BCP47[lang])
	});
};

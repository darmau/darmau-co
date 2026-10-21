import { BCP47, LANGS, localize } from '$lib/i18n';
import { ogImageUrl } from '$lib/image';
import { getSupabase, listAlbumsWithPhotos } from '$lib/server/albums';
import type { RequestHandler } from './$types';

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env;
	const base = env?.BASE_URL ?? 'https://gallery.darmau.co';
	const prefix = env?.IMG_PREFIX ?? '';
	// 每个相册在三种语言下都有页面（缺翻译时回落中文），以中文列表为准
	const albums = await listAlbumsWithPhotos(getSupabase(env), 'zh');

	const entry = (path: string, lastmod?: string, image?: string) => {
		const alternates = LANGS.map(
			(l) => `<xhtml:link rel="alternate" hreflang="${BCP47[l]}" href="${escape(base + localize(l, path))}"/>`
		).join('');
		const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${escape(base + path)}"/>`;
		const mod = lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : '';
		const img = image ? `<image:image><image:loc>${escape(image)}</image:loc></image:image>` : '';
		return LANGS.map(
			(l) => `<url><loc>${escape(base + localize(l, path))}</loc>${mod}${alternates}${xDefault}${img}</url>`
		).join('\n');
	};

	const latest = albums[0]?.publishedAt;
	const urls = [
		entry('/', latest),
		entry('/albums', latest),
		...albums.flatMap((a) => [
			entry(`/albums/${a.slug}`, a.publishedAt, ogImageUrl(prefix, a.cover.storageKey)),
			...a.photos.map((p) => entry(`/albums/${a.slug}/${p.id}`, a.publishedAt, ogImageUrl(prefix, p.storageKey)))
		])
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};

import { error } from '@sveltejs/kit';
import { getAlbum, getSupabase } from '$lib/server/albums';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform, setHeaders }) => {
	const album = await getAlbum(getSupabase(platform?.env), locals.lang, params.slug);
	const start = album?.photos.findIndex((p) => p.id === params.photoId) ?? -1;
	if (!album || start < 0) error(404, 'Photo not found');

	setHeaders(PAGE_CACHE);

	// 查看器只需要照片和相册标题；整页数据会序列化进 HTML，正文等不用带
	return {
		album: { slug: album.slug, title: album.title, fallback: album.fallback, photos: album.photos },
		start
	};
};

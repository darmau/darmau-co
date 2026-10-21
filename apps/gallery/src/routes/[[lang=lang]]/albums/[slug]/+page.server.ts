import { error } from '@sveltejs/kit';
import { getAlbum, getSupabase, listAlbums, toCard } from '$lib/server/albums';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform, setHeaders }) => {
	const supabase = getSupabase(platform?.env);
	const [album, all] = await Promise.all([
		getAlbum(supabase, locals.lang, params.slug),
		listAlbums(supabase, locals.lang)
	]);
	if (!album) error(404, 'Album not found');

	setHeaders(PAGE_CACHE);

	// 列表按发布时间倒序，「下一个」是更早的那一个；到最老的一个就绕回最新
	const at = all.findIndex((a) => a.slug === album.slug);
	const next = all.length > 1 ? all[(at + 1) % all.length] : undefined;

	return {
		album: { ...album, no: all[at]?.no ?? 0 },
		next: next && toCard(next)
	};
};

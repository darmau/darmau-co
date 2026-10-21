import { getSupabase, listAlbums } from '$lib/server/albums';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, setHeaders }) => {
	const albums = await listAlbums(getSupabase(platform?.env), locals.lang);
	setHeaders(PAGE_CACHE);
	return { albums };
};

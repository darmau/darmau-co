import { getSupabase, listAlbums, toCard } from '$lib/server/albums';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const HOME_LIMIT = 12;

export const load: PageServerLoad = async ({ locals, platform, setHeaders }) => {
	const albums = await listAlbums(getSupabase(platform?.env), locals.lang);
	setHeaders(PAGE_CACHE);

	const hero = albums.find((a) => a.pinned) ?? albums[0];

	return {
		hero,
		albums: albums.slice(0, HOME_LIMIT).map(toCard),
		total: albums.length,
		points: albums
			.filter((a) => a.center)
			.map((a) => ({ slug: a.slug, title: a.title, lat: a.center!.lat, lng: a.center!.lng }))
	};
};

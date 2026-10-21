import { getSupabase, listAlbums, toCard } from '$lib/server/albums';
import { HOME_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const HOME_LIMIT = 12;

/** Fisher–Yates 洗牌后取前 n 个 */
function sample<T>(items: T[], n: number): T[] {
	const pool = [...items];
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pool[i], pool[j]] = [pool[j]!, pool[i]!];
	}
	return pool.slice(0, n);
}

export const load: PageServerLoad = async ({ locals, platform, setHeaders }) => {
	const albums = await listAlbums(getSupabase(platform?.env), locals.lang);
	setHeaders(HOME_CACHE);

	const hero = albums.find((a) => a.pinned) ?? albums[0];

	return {
		hero,
		// 瀑布流：从精选相册里随机挑；随机在服务端做，水合前后一致不会跳
		albums: sample(
			albums.filter((a) => a.featured),
			HOME_LIMIT
		).map(toCard),
		total: albums.length,
		// 足迹地图只画点，不需要名字
		points: albums.filter((a) => a.center).map((a) => ({ slug: a.slug, lat: a.center!.lat, lng: a.center!.lng }))
	};
};

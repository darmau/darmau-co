import { getSupabase, listAlbums, toCard } from '$lib/server/albums';
import { HOME_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const HERO_COUNT = 3;
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

	// 一次抽 15 个精选：前 3 个给主图轮播，后 12 个给瀑布流，两处不会重复
	const picks = sample(
		albums.filter((a) => a.featured),
		HERO_COUNT + HOME_LIMIT
	);
	// 精选为空时（理论上不会）退回最新的一个，避免首页没有主图
	const hero = picks.length ? picks.slice(0, HERO_COUNT) : albums.slice(0, 1);

	return {
		hero,
		albums: picks.slice(HERO_COUNT).map(toCard),
		total: albums.length,
		// 足迹地图只画点，不需要名字
		points: albums.filter((a) => a.center).map((a) => ({ slug: a.slug, lat: a.center!.lat, lng: a.center!.lng }))
	};
};

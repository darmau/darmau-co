import type { MapImageCollection } from '$components/MapGallery.svelte';
import type { PageServerLoad } from './$types';

const EMPTY_COLLECTION: MapImageCollection = { type: 'FeatureCollection', features: [] };

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;
	const env = platform?.env;

	// 🚀 一行调用数据库函数，直接获取完整的 GeoJSON！
	const { data: geojson, error } = await supabase.rpc('get_photo_map_geojson', {
		lang_code: lang
	});

	if (error) {
		console.error('Error fetching map data:', error);
		return {
			imageCollection: EMPTY_COLLECTION,
			MAPBOX: env?.MAPBOX_TOKEN ?? '',
			imgPrefix: env?.IMG_PREFIX ?? '',
			baseUrl: env?.BASE_URL ?? '',
			availableLangs: ['zh', 'en', 'jp'],
			latestPhotoStorageKey: null
		};
	}

	// 获取最新相册的封面图片，用于 OpenGraph
	const { data: latestPhoto } = await supabase
		.from('photo')
		.select(
			`
      cover (storage_key)
    `
		)
		// 旧代码就是这么写的：没有 !inner，PostgREST 其实不会按语言过滤，照抄不改。
		.eq('language.lang', lang)
		.eq('is_draft', false)
		.order('published_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	const imageCollection = (geojson ?? EMPTY_COLLECTION) as unknown as MapImageCollection;

	const availableLangs = ['zh', 'en', 'jp'];

	return {
		imageCollection,
		MAPBOX: env?.MAPBOX_TOKEN ?? '',
		imgPrefix: env?.IMG_PREFIX ?? '',
		baseUrl: env?.BASE_URL ?? '',
		availableLangs,
		latestPhotoStorageKey: latestPhoto?.cover?.storage_key || null
	};
};

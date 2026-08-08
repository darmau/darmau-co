import { error } from '@sveltejs/kit';
import type { FeaturedPhoto } from '$lib/utils/generatePhotoAlbum';
import type { PageServerLoad } from './$types';

type FeaturedRow = {
	id: number;
	slug: string | null;
	title: string | null;
	page_view: number | null;
	language: {
		lang: string | null;
	} | null;
	cover: {
		id: string | number;
		alt: string | null;
		storage_key: string;
		width: number | null;
		height: number | null;
	} | null;
};

const normalizeFeatured = (rows: unknown, fallbackLang: string): FeaturedPhoto[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	const normalized: FeaturedPhoto[] = [];

	rows.forEach((row) => {
		if (!row || typeof row !== 'object') {
			return;
		}

		const candidate = row as FeaturedRow;
		if (typeof candidate.id !== 'number' || !candidate.cover || !candidate.language) {
			return;
		}

		normalized.push({
			id: candidate.id,
			slug: candidate.slug,
			title: candidate.title ?? '',
			language: {
				lang: candidate.language.lang ?? fallbackLang
			},
			cover: {
				id: String(candidate.cover.id),
				alt: candidate.cover.alt,
				storage_key: candidate.cover.storage_key,
				width: candidate.cover.width ?? 0,
				height: candidate.cover.height ?? 0
			}
		});
	});

	return normalized;
};

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;

	const table = `random_${lang}_photos` as
		| 'random_en_photos'
		| 'random_jp_photos'
		| 'random_zh_photos';

	// 从photo表中获取lang对应的language.lang字段的数据，并从photo_image表中获取photo_id对应的数据
	const { data: rawFeaturedPhotos, error: queryError } = await supabase
		.from(table)
		.select(
			`
      id,
      slug,
      title,
      page_view,
      language!inner (lang),
      cover (id, alt, storage_key, width, height)
      `
		)
		// random_*_photos 是历史遗留视图，select 的是 photo.*（含 is_draft）且不受
		// RLS 保护，草稿要靠这里显式挡掉。
		.eq('is_draft', false)
		.limit(32);

	if (queryError) {
		error(500, queryError.message);
	}

	const availableLangs = ['zh', 'en', 'jp'];
	const env = platform?.env;

	return {
		featuredPhotos: normalizeFeatured(rawFeaturedPhotos, lang),
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

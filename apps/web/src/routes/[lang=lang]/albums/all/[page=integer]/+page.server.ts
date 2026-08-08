import { error } from '@sveltejs/kit';
import type { GalleryItem, GalleryMediaImage } from '$lib/types/Gallery';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

// gallery_feed view 返回的行类型
type GalleryFeedRow = {
	content_type: 'photo' | 'thought';
	id: number;
	slug: string | null;
	title: string | null;
	content_text: string | null;
	created_at: string | null;
	sort_date: string | null;
	lang: string | null;
	cover: {
		id: string | number;
		alt: string | null;
		storage_key: string;
		width: number | null;
		height: number | null;
	} | null;
	images:
		| {
				order: number | null;
				image: {
					id: string | number;
					alt: string | null;
					storage_key: string;
					width: number | null;
					height: number | null;
				};
		  }[]
		| null;
};

const normalizeGalleryFeed = (rows: unknown): GalleryItem[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	return rows.flatMap((row) => {
		if (!row || typeof row !== 'object') {
			return [];
		}

		const item = row as GalleryFeedRow;
		if (typeof item.id !== 'number') {
			return [];
		}

		// 从 images 数组提取图片，按 order 排序
		const images: GalleryMediaImage[] = (item.images ?? [])
			.filter((entry) => entry?.image?.storage_key)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map((entry) => ({
				id: String(entry.image.id),
				alt: entry.image.alt ?? null,
				storage_key: entry.image.storage_key,
				width: entry.image.width ?? 0,
				height: entry.image.height ?? 0
			}));

		// 如果没有 images 但有 cover，使用 cover 作为图片
		if (images.length === 0 && item.cover?.storage_key) {
			images.push({
				id: String(item.cover.id),
				alt: item.cover.alt ?? null,
				storage_key: item.cover.storage_key,
				width: item.cover.width ?? 0,
				height: item.cover.height ?? 0
			});
		}

		return [
			{
				type: item.content_type,
				id: item.id,
				slug: item.slug,
				title: item.title ?? '',
				content: item.content_text ?? '',
				createdAt: item.sort_date ?? '',
				images
			}
		];
	});
};

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;
	const page = Number(params.page);

	// [page=integer] 只保证是纯数字串，"0" 仍然会命中路由，所以旧的 page < 1 判断要留着
	if (!Number.isInteger(page) || page < 1) {
		error(404, 'Not Found');
	}

	// 使用 gallery_feed view 进行数据库层分页
	const start = (page - 1) * PAGE_SIZE;
	const end = start + PAGE_SIZE - 1;

	const [feedResult, countResult] = await Promise.all([
		supabase
			.from('gallery_feed')
			.select('*')
			.or(`lang.eq.${lang},lang.is.null`) // photo 按语言过滤，thought 无语言限制
			.order('sort_date', { ascending: false })
			.range(start, end),
		supabase
			.from('gallery_feed')
			.select('*', { count: 'exact', head: true })
			.or(`lang.eq.${lang},lang.is.null`)
	]);

	if (feedResult.error) {
		error(500, feedResult.error.message);
	}

	const items = normalizeGalleryFeed(feedResult.data);
	const availableLangs = ['zh', 'en', 'jp'];
	const env = platform?.env;

	return {
		items,
		count: countResult.count ?? 0,
		page,
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

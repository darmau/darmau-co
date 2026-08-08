import { normalizeArticles } from '$lib/utils/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const page = params.page;
	const env = platform?.env;

	// 原来这里有 `if (isNaN(Number(page))) return new Response(null, {status: 404})`，
	// [page=integer] matcher 已经保证 page 是纯数字，判断删掉。

	const { data } = await locals.supabase
		.from('article')
		.select(
			`
      id,
      title,
      slug,
      subtitle,
      abstract,
      is_featured,
      is_premium,
      topic,
      published_at,
      page_view,
      category (title, slug),
      cover (alt, storage_key, width, height),
      language!inner (lang),
      comments:comment(id)
    `
		)
		.eq('language.lang', lang)
		.limit(12)
		.range((Number(page) - 1) * 12, Number(page) * 12 - 1)
		.filter('is_draft', 'eq', false)
		.filter('is_featured', 'eq', true)
		.order('published_at', { ascending: false });

	// 指定语言article的数量，排除草稿
	const { count } = await locals.supabase
		.from('article')
		.select(
			`
    id,
    language!inner (lang)
  `,
			{ count: 'exact', head: true }
		)
		.filter('is_draft', 'eq', false)
		.filter('is_featured', 'eq', true)
		.eq('language.lang', lang);

	const availableLangs = ['zh', 'en', 'jp'];

	return {
		articles: normalizeArticles(data),
		articleCount: count ?? 0,
		page: Number(page),
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

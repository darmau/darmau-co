import {
	normalizeArticles,
	normalizeCategoryCounts,
	normalizeCategorySummary,
	normalizeYearCounts
} from '$lib/utils/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const category = params.category;
	const page = params.page;
	const env = platform?.env;

	// 原来这里有 `if (isNaN(Number(page))) return new Response(null, {status: 404})`，
	// [page=integer] matcher 已经保证 page 是纯数字，判断删掉。

	// 查询指定语言，published_at在年份之间，排除草稿
	const { data: articleRows } = await locals.supabase
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
      category!inner (title, slug),
      language!inner (lang),
      comments:comment(id)
      `
		)
		.eq('language.lang', lang)
		.eq('category.slug', category)
		.eq('is_draft', false)
		.limit(12)
		.order('published_at', { ascending: false })
		.range((Number(page) - 1) * 12, Number(page) * 12 - 1);

	// 指定语言article的数量，排除草稿
	const { count } = await locals.supabase
		.from('article')
		.select(
			`
    id,
    language!inner (lang),
    category!inner (slug)
  `,
			{ count: 'exact', head: true }
		)
		.eq('is_draft', false)
		.eq('category.slug', category)
		.eq('language.lang', lang);

	const { data: countByYearData } = await locals.supabase.rpc('get_article_count_by_year', {
		lang_name: lang
	});

	const { data: countByCategoryData } = await locals.supabase.rpc('get_article_count_by_category', {
		lang_name: lang
	});

	// 分类数据
	const { data: categoryData } = await locals.supabase
		.from('category')
		.select(
			`
      title,
      slug,
      description,
      cover (alt, storage_key, width, height),
      language!inner (lang)
    `
		)
		.eq('slug', category)
		.eq('type', 'article')
		.eq('language.lang', lang)
		.single();

	const availableLangs = [lang];

	return {
		articles: normalizeArticles(articleRows),
		category: normalizeCategorySummary(categoryData),
		countByYear: normalizeYearCounts(countByYearData),
		countByCategory: normalizeCategoryCounts(countByCategoryData),
		articleCount: count ?? 0,
		page: Number(page),
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

import {
	normalizeArticles,
	normalizeCategoryCounts,
	normalizeYearCounts
} from '$lib/utils/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const year = params.year;
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
      page_view,
      published_at,
      category (title, slug),
      language!inner (lang),
      comments:comment(id)
      `
		)
		.eq('language.lang', lang)
		.eq('is_draft', false)
		.limit(12)
		.gte('published_at', `${year}-01-01T00:00:00Z`)
		.lte('published_at', `${year}-12-31T23:59:59Z`)
		.order('published_at', { ascending: false })
		.range((Number(page) - 1) * 12, Number(page) * 12 - 1);

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
		.eq('is_draft', false)
		.eq('language.lang', lang)
		.gte('published_at', `${year}-01-01T00:00:00Z`)
		.lte('published_at', `${year}-12-31T23:59:59Z`);

	const { data: countByYearData } = await locals.supabase.rpc('get_article_count_by_year', {
		lang_name: lang
	});

	const { data: countByCategoryData } = await locals.supabase.rpc('get_article_count_by_category', {
		lang_name: lang
	});

	const availableLangs = [lang];

	return {
		articles: normalizeArticles(articleRows),
		year: Number(year),
		countByYear: normalizeYearCounts(countByYearData),
		countByCategory: normalizeCategoryCounts(countByCategoryData),
		articleCount: count ?? 0,
		page: Number(page),
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

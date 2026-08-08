import {
	normalizeArticles,
	normalizeCategoryCounts,
	normalizeYearCounts
} from '$lib/utils/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const page = params.page;
	const env = platform?.env;

	// 原来这里有 `if (isNaN(Number(page))) return new Response(null, {status: 404})`，
	// [page=integer] matcher 已经保证 page 是纯数字，判断删掉。

	const [articleRowsResult, articleCountResult, countByYearResult, countByCategoryResult] =
		await Promise.all([
			locals.supabase
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
        language!inner (lang),
        comments:comment(id)
      `
				)
				.eq('language.lang', lang)
				.eq('is_draft', false)
				.limit(12)
				.range((Number(page) - 1) * 12, Number(page) * 12 - 1)
				.order('published_at', { ascending: false }),
			locals.supabase
				.from('article')
				.select(
					`
        id,
        language!inner (lang)
      `,
					{ count: 'exact', head: true }
				)
				.eq('is_draft', false)
				.eq('language.lang', lang),
			locals.supabase.rpc('get_article_count_by_year', { lang_name: lang }),
			locals.supabase.rpc('get_article_count_by_category', {
				lang_name: lang
			})
		]);

	const articleRows = articleRowsResult.data ?? [];
	const count = articleCountResult.count ?? 0;
	const countByYearData = countByYearResult.data ?? [];
	const countByCategoryData = countByCategoryResult.data ?? [];

	const availableLangs = [lang];

	return {
		articles: normalizeArticles(articleRows),
		countByYear: normalizeYearCounts(countByYearData),
		countByCategory: normalizeCategoryCounts(countByCategoryData),
		articleCount: count ?? 0,
		page: Number(page),
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

import { error } from '@sveltejs/kit';
import HomepageText from '$lib/locales/homepage';
import type { Article } from '$lib/types/Article';
import { normalizeCommentCount } from '$lib/utils/articles';
import getLanguageLabel from '$lib/utils/getLanguageLabel';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const env = platform?.env;
	const availableLangs = ['zh', 'en', 'jp'];

	// 如果lang不在availableLangs里，返回404
	// （[lang=lang] matcher 已经保证 lang 合法，这里只是把原来的
	// `throw new Response(null, {status: 404})` 照规范换成 error()）
	if (!availableLangs.includes(lang)) {
		error(404, 'No such language');
	}

	// 获取指定语言的文章，is_top为true的排第一，剩下按published_at倒序排列
	const { data: articleData } = await locals.supabase
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
      cover (alt, storage_key, width, height),
      category (title, slug),
      language!inner (lang),
      comments:comment(id)
      `
		)
		.eq('language.lang', lang)
		.filter('is_draft', 'eq', false)
		.limit(16)
		.order('is_top', { ascending: false })
		.order('published_at', { ascending: false })
		.returns<Article[]>();

	const label = getLanguageLabel(HomepageText, lang);

	// comment(id) 返回的是评论行数组，卡片要的是 [{count}]
	const articles = (articleData ?? []).map((article) => ({
		...article,
		comments: normalizeCommentCount(article.comments)
	}));

	return {
		articles,
		label,
		baseUrl: env?.BASE_URL ?? '',
		prefix: env?.IMG_PREFIX ?? '',
		availableLangs
	};
};

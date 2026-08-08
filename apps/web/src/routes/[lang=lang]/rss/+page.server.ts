import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;

	const { data: articles } = await supabase
		.from('article')
		.select(
			`
      id,
      title,
      subtitle,
      published_at,
      language!inner (lang)
    `
		)
		.eq('is_draft', false)
		.eq('language.lang', lang)
		.order('published_at', { ascending: false })
		.limit(5);

	const { data: photos } = await supabase
		.from('photo')
		.select(
			`
      id,
      title,
      published_at,
      language!inner (lang),
      cover (storage_key)
    `
		)
		.eq('is_draft', false)
		.eq('is_featured', true)
		.eq('language.lang', lang)
		.order('published_at', { ascending: false })
		.limit(9);

	const { data: thoughts } = await supabase
		.from('thought')
		.select(
			`
      id,
      content_text,
      created_at
    `
		)
		.order('created_at', { ascending: false })
		.limit(7);

	const availableLangs = ['zh', 'en', 'jp'];

	return {
		articles,
		photos,
		thoughts,
		baseUrl: platform?.env?.BASE_URL ?? '',
		availableLangs
	};
};

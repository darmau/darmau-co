import SiteText from '$lib/locales/site';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const lang = params.lang;
	const content = SiteText(lang);

	const availableLangs = ['zh', 'en', 'jp'];

	return {
		content,
		baseUrl: platform?.env?.BASE_URL ?? '',
		availableLangs
	};
};

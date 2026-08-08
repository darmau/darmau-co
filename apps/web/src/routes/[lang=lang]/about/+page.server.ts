import AboutText from '$lib/locales/about';
import HomepageText from '$lib/locales/homepage';
import getLanguageLabel from '$lib/utils/getLanguageLabel';
import { generatePersonStructuredData } from '$lib/utils/structuredData';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const lang = params.lang;
	const env = platform?.env;

	const content = AboutText(lang);

	const { data: profileImage } = await locals.supabase
		.from('image')
		.select('alt, storage_key, width, height, caption')
		.eq('storage_key', 'ba07adad-3f02-409b-ad39-2814b6f2ede3')
		.single();

	const baseUrl = env?.BASE_URL ?? '';
	const prefix = env?.IMG_PREFIX ?? '';
	const label = getLanguageLabel(HomepageText, lang);

	return {
		content,
		profileImage,
		baseUrl,
		prefix,
		availableLangs: ['zh', 'en', 'jp'],
		structuredData: generatePersonStructuredData({
			name: '李大毛',
			description: label.about_description,
			image: {
				url: `${prefix}/cdn-cgi/image/format=jpeg,width=800/ba07adad-3f02-409b-ad39-2814b6f2ede3`,
				width: 800,
				height: 800
			},
			url: `${baseUrl}/${lang}/about`,
			sameAs: [
				'https://x.com/darmau8964',
				'https://github.com/Darmau',
				'https://www.instagram.com/ridamoe',
				'https://www.youtube.com/@darmau'
			]
		})
	};
};

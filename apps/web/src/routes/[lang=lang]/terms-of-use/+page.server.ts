import { marked } from 'marked';
import zhContent from '$lib/content/legal/zh.md?raw';
import enContent from '$lib/content/legal/en.md?raw';
import jpContent from '$lib/content/legal/jp.md?raw';
import type { PageServerLoad } from './$types';

const TERMS_BY_LANG: Record<string, string> = {
	zh: zhContent,
	en: enContent,
	jp: jpContent
};

const AVAILABLE_LANGS = Object.keys(TERMS_BY_LANG);

marked.setOptions({ gfm: true, breaks: true });

export const load: PageServerLoad = async ({ params, platform }) => {
	const lang = params.lang;

	return {
		html: await marked.parse(TERMS_BY_LANG[lang] ?? TERMS_BY_LANG.zh),
		baseUrl: platform?.env?.BASE_URL ?? '',
		availableLangs: AVAILABLE_LANGS
	};
};

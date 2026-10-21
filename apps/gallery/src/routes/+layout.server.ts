import { dict } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, platform }) => {
	const env = platform?.env;
	return {
		lang: locals.lang,
		t: dict(locals.lang),
		imgPrefix: env?.IMG_PREFIX ?? '',
		baseUrl: env?.BASE_URL ?? 'https://gallery.darmau.co',
		// pk. 开头的公开 token，本来就会出现在浏览器里；在 Mapbox 后台按域名限制
		mapboxToken: env?.MAPBOX_TOKEN ?? ''
	};
};

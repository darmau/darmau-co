import type { Map as MapboxMap } from 'mapbox-gl';
import { MAPBOX_LANG, type Lang } from '$lib/i18n';

export const ACCENT = '#E8A33D';

/** mapbox-gl 在模块顶层访问 window，只能在浏览器里动态引入；CSS 也一起按需加载，不阻塞首屏 */
export async function loadMapbox(token: string) {
	const [{ default: mapboxgl }] = await Promise.all([
		import('mapbox-gl'),
		import('mapbox-gl/dist/mapbox-gl.css')
	]);
	mapboxgl.accessToken = token;
	return mapboxgl;
}

export async function applyLanguage(map: MapboxMap, lang: Lang) {
	const { default: MapboxLanguage } = await import('@mapbox/mapbox-gl-language');
	map.addControl(new MapboxLanguage({ defaultLanguage: MAPBOX_LANG[lang] }));
}

/** dark-v11 的底色偏冷，按站点 token 改成暖黑 */
export function tintDarkStyle(map: MapboxMap) {
	const paint: [string, string, string][] = [
		['land', 'background-color', '#0C0C0B'],
		['water', 'fill-color', '#151513'],
		['landuse', 'fill-color', '#121210'],
		['national-park', 'fill-color', '#121210']
	];
	for (const [layer, prop, value] of paint) {
		if (map.getLayer(layer)) map.setPaintProperty(layer, prop as 'fill-color', value);
	}
}

/** 进入视口才初始化地图，返回取消观察的函数 */
export function whenVisible(node: Element, callback: () => void) {
	const observer = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				observer.disconnect();
				callback();
			}
		},
		{ rootMargin: '200px' }
	);
	observer.observe(node);
	return () => observer.disconnect();
}

export const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

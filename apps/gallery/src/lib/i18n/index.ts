import zh from './zh';
import ja from './ja';
import en from './en';

export const LANGS = ['zh', 'ja', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'zh';

export type Dict = typeof zh;
const DICTS: Record<Lang, Dict> = { zh, ja, en };

export const dict = (lang: Lang): Dict => DICTS[lang];

/** 数据库 language.lang 用的是 jp，URL 和 <html lang> 用合法的 ja */
export const DB_LANG: Record<Lang, string> = { zh: 'zh', ja: 'jp', en: 'en' };

/** Mapbox 语言插件的代码 */
export const MAPBOX_LANG: Record<Lang, string> = { zh: 'zh-Hans', ja: 'ja', en: 'en' };

export const BCP47: Record<Lang, string> = { zh: 'zh-CN', ja: 'ja-JP', en: 'en-US' };

export function toLang(param: string | undefined): Lang {
	return param === 'ja' || param === 'en' ? param : DEFAULT_LANG;
}

/** 给站内路径加语言前缀。path 以 / 开头 */
export function localize(lang: Lang, path: string): string {
	if (lang === DEFAULT_LANG) return path;
	return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

/** 去掉路径上的语言前缀，用于语言切换 */
export function stripLang(pathname: string): string {
	const stripped = pathname.replace(/^\/(ja|en)(?=\/|$)/, '');
	return stripped === '' ? '/' : stripped;
}

/** 简单的 {name} 占位符替换 */
export function fmt(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

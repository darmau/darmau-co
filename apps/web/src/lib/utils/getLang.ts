import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

/**
 * 把 Accept-Language 协商成本站的语言路径段（/zh、/en、/jp）。
 *
 * 关键一点：`jp` 是路径段，不是语言代码——日语的 ISO 639-1 是 `ja`。
 * 所以协商必须拿 `ja` 去比，再映射回路径段。早先这里直接把 `jp` 塞进
 * 候选列表，结果浏览器发来的 `Accept-Language: ja` 谁都匹配不上，
 * 日语用户会被静默送到中文版；`ja-JP,ja;q=0.9,en;q=0.8` 更糟，会落到
 * 优先级更低的英文。
 *
 * 仓库里其他地方是同一套对应关系：i18nLinks 的 hreflang、mapbox 的
 * 界面语言、api/translate 的 target_lang，都是「路径段 jp / 语言码 ja」。
 */
const SEGMENT_BY_LOCALE: Record<string, string> = {
  zh: 'zh',
  en: 'en',
  ja: 'jp'
};

// 候选列表里只能放合法语言代码。放过 `jp` 这种伪代码会污染 best-fit 匹配：
// 匹配器对它没有 likely-subtags 数据，于是任何不认识的语言（比如 xx-INVALID）
// 都会被判成离它最近，一律落到日语。
const NEGOTIABLE_LOCALES = Object.keys(SEGMENT_BY_LOCALE);
const DEFAULT_LOCALE = 'zh';

/** 少数客户端会把日语错写成 jp，请求侧顺手认了，但不放进候选列表 */
const REQUEST_ALIASES: Record<string, string> = { jp: 'ja' };

/**
 * `*` 是 Accept-Language 的合法取值，`xx-INVALID` 这类畸形标签也可能出现，
 * 而 intl-localematcher 碰到不能规范化的标签会抛 RangeError。这个函数跑在
 * hooks 里，抛出去就是整个请求 500，所以先筛一遍。
 */
function toWellFormedTags(tags: string[]): string[] {
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = REQUEST_ALIASES[tag.toLowerCase()] ?? tag;
    try {
      if (Intl.getCanonicalLocales(normalized).length > 0) result.push(normalized);
    } catch {
      // 规范化不了的标签（`*`、乱码）直接丢掉
    }
  }

  return result;
}

/**
 * 路径段 -> 合法的 BCP-47 语言代码，给 `<html lang>` 这类要被机器读的地方用。
 * `jp` 只是我们的 URL 约定，写进 lang 属性屏幕阅读器不会切到日语发音，
 * 搜索引擎也认不出来。i18nLinks 生成 hreflang 时用的是同一套对应关系。
 */
const BCP47_BY_SEGMENT: Record<string, string> = {
  zh: 'zh',
  en: 'en',
  jp: 'ja'
};

export function toBcp47(segment: string): string {
  return BCP47_BY_SEGMENT[segment] ?? segment;
}

export function getLang(request: Request): string {
  const acceptLanguage = request.headers.get('Accept-Language') ?? '';
  const requested = toWellFormedTags(
    new Negotiator({ headers: { 'accept-language': acceptLanguage } }).languages()
  );

  if (requested.length === 0) return SEGMENT_BY_LOCALE[DEFAULT_LOCALE];

  const matched = match(requested, NEGOTIABLE_LOCALES, DEFAULT_LOCALE);

  return SEGMENT_BY_LOCALE[matched] ?? SEGMENT_BY_LOCALE[DEFAULT_LOCALE];
}

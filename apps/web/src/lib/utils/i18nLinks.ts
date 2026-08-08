// 对于固定页面：接收当前语言
// 对于动态页面，接收当前语言和拥有的语言

export interface I18nLinkTag {
  tagName: "link";
  rel: "canonical" | "alternate";
  href: string;
  hrefLang?: string;
}

export interface I18nMetaTag {
  property: "og:locale:alternate";
  content: string;
}

export type I18nTag = I18nLinkTag | I18nMetaTag;

export default function i18nLinks(baseUrl: string, currentLang: string, availableLangs: string[], url: string): I18nTag[] {
  const canonical: I18nLinkTag = {
    tagName: "link",
    rel: "canonical",
    href: `${baseUrl}/${currentLang}/${url}`,
  };
  // 从availableLangs中过滤掉当前语言
  const langs = availableLangs.filter((l) => l !== currentLang);

  const links: I18nLinkTag[] = langs.map((l) => {
    return {
      tagName: "link",
      rel: "alternate",
      href: `${baseUrl}/${l}/${url}`,
      hrefLang: langMap.get(l),
    };
  });

  const ogLocale: I18nMetaTag[] = langs.map((l) => {
    return {
      property: "og:locale:alternate",
      content: l
    }
  });

  // 展开语言链接，返回数组
  return [canonical, ...links, ...ogLocale];
}

const langMap = new Map([
    ['en', 'en'],
    ['zh', 'zh-Hans'],
    ['jp', 'ja'],
])

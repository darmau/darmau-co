import { describe, expect, it } from 'vitest';
import { getLang, toBcp47 } from './getLang';

const req = (acceptLanguage?: string) =>
  new Request('https://darmau.co/', {
    headers: acceptLanguage === undefined ? {} : { 'Accept-Language': acceptLanguage }
  });

describe('getLang', () => {
  it('日语走 ja，落到 /jp 路径段', () => {
    // 站点路径段是 jp，但浏览器发的是 ja；早先候选列表里直接写 jp，
    // 这几个用例全都错落到中文（最后一个甚至落到优先级更低的英文）
    expect(getLang(req('ja'))).toBe('jp');
    expect(getLang(req('ja-JP'))).toBe('jp');
    expect(getLang(req('ja-JP,ja;q=0.9,en;q=0.8'))).toBe('jp');
  });

  it('首选语言不支持时按 q 值退到次选', () => {
    expect(getLang(req('ko,ja;q=0.8'))).toBe('jp');
    expect(getLang(req('de,fr;q=0.9,en;q=0.5'))).toBe('en');
  });

  it('英文和中文各归各的', () => {
    expect(getLang(req('en'))).toBe('en');
    expect(getLang(req('en-US,en;q=0.9'))).toBe('en');
    expect(getLang(req('en-GB'))).toBe('en');
    expect(getLang(req('zh'))).toBe('zh');
    expect(getLang(req('zh-CN,zh;q=0.9'))).toBe('zh');
    // 站点只有一种中文，繁体也归到 zh
    expect(getLang(req('zh-TW'))).toBe('zh');
    expect(getLang(req('zh-Hant'))).toBe('zh');
  });

  it('不支持的语言落到默认的中文', () => {
    expect(getLang(req('fr-FR'))).toBe('zh');
    expect(getLang(req('ko'))).toBe('zh');
  });

  it('缺失或畸形的 Accept-Language 不抛异常，落到默认值', () => {
    // `*` 是合法取值，但 intl-localematcher 规范化不了会抛 RangeError；
    // getLang 跑在 hooks 里，抛出去就是每个请求 500
    expect(getLang(req('*'))).toBe('zh');
    expect(getLang(req(''))).toBe('zh');
    expect(getLang(req())).toBe('zh');
    expect(getLang(req(' ,, '))).toBe('zh');
    expect(getLang(req('en;q=abc'))).toBe('zh');
    // 结构合法但没人认识的语言，不该被判成离日语最近
    expect(getLang(req('xx-INVALID'))).toBe('zh');
  });

  it('容忍客户端把日语错写成 jp', () => {
    expect(getLang(req('jp'))).toBe('jp');
  });
});

describe('toBcp47', () => {
  it('把路径段 jp 换成合法的语言代码 ja', () => {
    // <html lang="jp"> 屏幕阅读器不会切到日语发音，搜索引擎也认不出来
    expect(toBcp47('jp')).toBe('ja');
  });

  it('zh 和 en 本身就是合法代码，原样返回', () => {
    expect(toBcp47('zh')).toBe('zh');
    expect(toBcp47('en')).toBe('en');
  });
});

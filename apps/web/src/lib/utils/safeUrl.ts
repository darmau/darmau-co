/**
 * 跳转目标与外链的安全校验。
 *
 * 两个不同的威胁：
 * - `next` 之类的跳转参数如果不校验，就是开放重定向，可以把用户带去钓鱼站；
 * - 评论者自填的 `website` 会进 `href`，`javascript:` 伪协议等价于存储型 XSS。
 */

/** 允许出现在 `href` 里的协议。其余一律当作不可信。 */
const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * 控制字符（含 Tab / 换行）会被浏览器在解析 URL 时剥掉，
 * 所以 `java\tscript:alert(1)` 能绕过朴素的前缀匹配。一律拒绝。
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/**
 * 站内跳转路径白名单校验。
 *
 * 只接受单个 `/` 开头的相对路径：`//evil.com` 会被浏览器当成协议相对 URL
 * 跳去外站，`https://evil.com` 更不用说。反斜杠要一并挡掉，因为部分浏览器
 * 会把 `\` 规范化成 `/`。
 */
export const isSafeRedirect = (value: unknown): value is string => {
  if (typeof value !== "string" || value === "") {
    return false;
  }

  if (!value.startsWith("/")) {
    return false;
  }

  // `//` 与 `/\` 都是协议相对 URL 的写法
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return false;
  }

  return !CONTROL_CHARS.test(value);
};

/** 校验跳转目标，不合法就退回 `fallback`（fallback 自身也会被校验）。 */
export const safeRedirect = (value: unknown, fallback = "/"): string => {
  if (isSafeRedirect(value)) {
    return value;
  }

  return isSafeRedirect(fallback) ? fallback : "/";
};

/**
 * 校验用户自填的外链，返回可安全放进 `href` 的字符串；不合法返回 null。
 *
 * 裸域名（`example.com`）补 `https://`，方便用户填写；补完仍解析失败或协议
 * 不在白名单内的，调用方应当只渲染纯文本而不是链接。
 */
export const safeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "" || CONTROL_CHARS.test(trimmed)) {
    return null;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }

  return parsed.toString();
};

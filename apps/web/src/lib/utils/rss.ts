/**
 * CDATA 段里唯一有意义的分隔符是 `]]>`。内容里只要出现它，后面的字符就跑到
 * CDATA 外面去了，等于可以往 feed 里注入任意 XML 节点——对把 feed 当 HTML
 * 渲染的阅读器来说就是 XSS。
 *
 * 标准做法是把 `]]>` 拆成「闭合 + 转义的 `>` + 重新打开」，
 * 这样解析出来的文本仍然是原样的 `]]>`。
 */
export function normalizeCdata(value?: string | null): string {
  if (!value) {
    return "";
  }
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

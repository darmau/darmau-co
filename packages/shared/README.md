# @darmau/shared

跨 app 共用的小工具。

## `@darmau/shared/unsubscribe-token`

评论通知邮件里"取消订阅"链接用的 HS256 JWT。**签发方和验证方必须用同一份实现**，
这就是它待在这里而不是任何一个 app 里的原因：

- `apps/notifier` 发通知邮件时签发（`generateUnsubscribeToken`）
- `apps/web` 的 `/$lang/unsubscribe` 路由验证（`verifyUnsubscribeToken`）

合并进 monorepo 之前，签发在 Supabase Edge Function 里用 `jose` 实现，验证在
前台用手写 WebCrypto 实现——两份代码各写各的，格式靠人记住。现在只有一份。

实现不依赖任何第三方库，只用 WebCrypto，Workers / Node / 浏览器都能跑。
Payload 形如 `{ comment_id, timestamp, iat }`，默认有效期 7 天。

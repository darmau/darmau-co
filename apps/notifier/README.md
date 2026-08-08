# notifier

评论 / 用户 / 站内信发生时的通知与富化 Worker。取代原来 `Darmau/supabase-edge-function`
仓库里的三个 Supabase Edge Function。

Cloudflare Worker 名：`firewood-notify`，自定义域名 <https://notify.darmau.co>
（在 `wrangler.jsonc` 的 `routes` 里声明，`wrangler deploy` 会一并维护）。

## 路由

路由名沿用旧的 Edge Function 名，所以 Supabase 那边只需要把 URL 前缀从
`https://<project>.supabase.co/functions/v1/` 换成 `https://notify.darmau.co/`。

| 路由 | 触发来源 | 行为 |
| --- | --- | --- |
| `POST /send-mail` | `comment` 表的 pg_net 触发器 | 有人回复了你的评论 → 发邮件通知 |
| `POST /bark` | `comment` / `users` / `message` 表的 Database Webhook | Bark 推送到手机 |
| `POST /ip-info` | `comment` 表的 Database Webhook | 查 ip-api.com，回填 `comment.ip_info` |
| `GET /health` | — | 存活探针，不需要鉴权 |

三条业务路由都要求 `Authorization: Bearer $WEBHOOK_SECRET`，否则 401。
（旧的 Edge Function 靠 Supabase 网关校验 service role key，Worker 没有这层，所以自己校验。）

## 与旧 Edge Function 的差异

- **邮件从 Resend 换成 Cloudflare Email Service**（`send_email` binding，见 `src/lib/email.ts`）。
  发信出口只有那一个文件，换回 Resend 只需要改它。
- **退订 token 改用 `@darmau/shared/unsubscribe-token`**。以前签发方用 `jose`、验证方
  （前台）用手写 WebCrypto，两份实现各写各的；现在共用一份，格式不可能再对不上。
- **邮件正文里的用户内容做了 HTML 转义**。旧模板直接把 `content_text` 插进 HTML，
  访客可控内容能注入标签。
- 业务判断逻辑逐条照搬，没有改：根评论跳过、`receive_notification` 为 false 跳过、
  INSERT 要求 `user_id` 且 `is_public`、UPDATE 只在 `is_public` 由 false 转 true 时发。

## 本地调试

```bash
cp .dev.vars.example .dev.vars   # 填好再跑
pnpm --filter notifier dev

curl -X POST localhost:8787/ip-info \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"table":"comment","record":{"id":<真实评论id>,"ip":"1.1.1.1"}}'
```

## 部署

```bash
pnpm --filter notifier deploy
pnpm --filter notifier exec wrangler secret put SUPABASE_URL
pnpm --filter notifier exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm --filter notifier exec wrangler secret put UNSUBSCRIBE_KEY
pnpm --filter notifier exec wrangler secret put WEBHOOK_SECRET
```

部署之后还要做的（都在 Cloudflare / Supabase 控制台，代码里做不了）：

1. 把发件域名 onboard 到 Cloudflare Email Service（要求域名用 Cloudflare DNS）
2. 在 Supabase 控制台 → SQL Editor 里把 `WEBHOOK_SECRET` 存进 Vault
   （值从 `.dev.vars` 取），然后才能 `pnpm --filter @darmau/database db:push`
   跑 repoint 迁移：

   ```sql
   select vault.create_secret(
     '<WEBHOOK_SECRET>',
     'notifier_secret',
     'apps/notifier 的 Bearer token'
   );
   ```

   用 Vault 而不是 `alter database ... set app.settings.*`，是因为 Supabase 的
   postgres 角色不是数据库 owner，ALTER DATABASE 会报 42501。Worker 的地址不是
   秘密，直接写死在迁移的函数里了。

3. Supabase 控制台 → Database Webhooks：把 `bark` 和 `ip-info` 的目标分别改成
   `https://notify.darmau.co/bark` 和 `https://notify.darmau.co/ip-info`，
   Header 加 `Authorization: Bearer <WEBHOOK_SECRET>`
4. 线上验证通过后，删掉 Supabase 上的三个旧 Edge Function

存活自检：

```bash
curl https://notify.darmau.co/health                      # → {"ok":true}
curl -X POST https://notify.darmau.co/bark -d '{}'        # → 401，说明鉴权生效
```

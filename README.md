# darmau.co

darmau.co 的 monorepo，用 [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.com) 管理。

由三个原本独立的仓库合并而来，git 历史全部保留（路径已重写到 `apps/` 下，
`git log` / `git blame` / `git log --follow` 都能直接回溯到合并之前）：

| 现在 | 原仓库 | 说明 |
| --- | --- | --- |
| `apps/web` | [Darmau/shinano-remix](https://github.com/Darmau/shinano-remix) | 前台，React Router 7 → Cloudflare Workers（Worker 名 `firewood-web`） |
| `apps/cms` | [Darmau/shinano-cms](https://github.com/Darmau/shinano-cms) | 后台，SvelteKit → Cloudflare Workers（Worker 名 `firewood-cms`） |
| `apps/minimalist` | [darmau/minimalist](https://github.com/darmau/minimalist) | Astro 前台重写，进行中 |

三个旧仓库保留作归档，不再更新。

## 结构

```
apps/
  web/          前台（React Router 7 + Cloudflare Workers，Worker 名 firewood-web）
  cms/          后台（SvelteKit + Cloudflare Workers，Worker 名 firewood-cms）
  minimalist/   Astro 前台实验
  notifier/     通知 Worker（Worker 名 firewood-notify），取代原来的 Supabase Edge Function
packages/
  database/     @darmau/database —— Supabase 迁移、config.toml、以及生成的 Database 类型
  shared/       @darmau/shared —— 跨 app 共用的小工具（目前是退订 token）
  tsconfig/     @darmau/tsconfig —— 共享 tsconfig base
```

`packages/database` 是 schema 与类型的唯一权威来源，详见
[packages/database/README.md](./packages/database/README.md)。
`apps/notifier` 的部署与线上切换步骤见 [apps/notifier/README.md](./apps/notifier/README.md)。

## 常用命令

所有任务都定义在各个 package 自己的 `package.json` 里，根目录只做转发。

```bash
pnpm install                       # 安装全部依赖（单一 lockfile）
pnpm build                         # = turbo run build
pnpm dev                           # 并行起所有 app 的 dev server
pnpm lint / check / typecheck / test

# 只针对某个 app
pnpm --filter web dev
pnpm turbo run build --filter=cms

# 数据库
pnpm --filter @darmau/database db:push
pnpm --filter @darmau/database db:types     # 重新生成共享类型
```

## 环境变量

各 app 自己管自己的（都在 gitignore 里）：

| 文件 | 属于 |
| --- | --- |
| `apps/web/.dev.vars` | `wrangler dev` 的本地 secret，线上走 `wrangler secret put` |
| `apps/cms/.env.local` | SvelteKit 的 `$env/static/*`，构建期注入 |
| `apps/minimalist/.env` | Astro 构建期注入 |

构建期会用到的变量已经在 `apps/*/turbo.json` 的 `env` 里声明，改动它们会正确让 turbo 缓存失效。

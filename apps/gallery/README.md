# gallery

独立摄影站 <https://gallery.darmau.co>。以相册为单位展示照片，每张照片带完整 EXIF 和拍摄位置。
三语：中文（默认，无前缀）、`/ja`、`/en`。

Cloudflare Worker 名：`firewood-gallery`（SvelteKit SSR，adapter-cloudflare）。
自定义域名在 `wrangler.jsonc` 的 `routes` 里声明，部署时自动维护。

## 数据从哪来

**和博客读的是同一个 Supabase，本 app 只读，不改任何表结构。** 内容全部在 CMS（`apps/cms`）里维护。

| 表 | 用到的字段 |
| --- | --- |
| `photo`（相册，每种语言一行，靠 `slug` 关联） | `slug` `title` `abstract` `content_html` `published_at` `is_featured` `is_draft` `cover` |
| `photo_image` | `order` |
| `image` | `storage_key` `width` `height` `alt` `caption` `location` `latitude` `longitude` `taken_at` `exif` |

规格里有、但库里没有的字段，全部由现有字段推导，或者直接不做：

| 页面上的 | 来源 |
| --- | --- |
| 相册编号 No.182 | 按发布时间排序，最早的是 1 |
| 相册副标题（地点） | 照片里出现最多的地名 |
| 地名 / 行政区 | 从 `image.location` 解析（`src/lib/server/place.ts`，支持大陆、日本、台湾三种地址格式） |
| 日期范围、海拔范围、器材 | 从各照片的 EXIF 汇总 |
| 带时区的拍摄时间 | 见下文「拍摄时间」 |
| 手记 | `image.caption`，为空就不显示 |
| 照片标题 | **没有**，照片只显示编号、时间、参数、位置 |
| LQIP 占位图 | `cdn-cgi/image` 出的 32px 模糊小图 |

### 拍摄时间

CMS 在 Worker（UTC 环境）里用 exifr 解析 EXIF，exifr 会把不带时区的 `DateTimeOriginal`
当成运行环境的本地时间，所以库里存的是「当地钟面时间 + Z」：长野 14:24 拍的照片存成
`2025-11-13T14:24:52.000Z`，`image.taken_at` 也一样。

这里只取钟面时间，再拼上 EXIF 里的 `OffsetTimeOriginal`（`src/lib/server/exif.ts`）。
相机时区本身没设对的（比如出国后相机还是日本时间），页面上照原样显示。

### 语言

库里日语是 `jp`，URL 和 `<html lang>` 用合法的 `ja`，在 `src/lib/i18n/index.ts` 里映射。
某个相册缺当前语言的翻译时，回落到中文那一行并在页面上提示。
UI 文案在 `src/lib/i18n/{zh,ja,en}.ts`。

## 新增相册

全部在 CMS 里操作，这个 app 不需要改动、也不需要重新部署。

1. 在 CMS 的「媒体」里上传照片。上传时会自动解析 EXIF、反查地址、剥掉原图的 EXIF 存进 R2
2. 在「照片」里新建相册：选照片、排顺序、设封面，写标题、摘要和正文
3. 想让它出现在首页，勾上**精选**（首页主图轮播和瀑布流都是从精选里随机挑的；
   「置顶」在这个站上不起作用）
4. 发布（取消草稿）
5. 需要日文 / 英文版时，在 CMS 里建同 `slug` 的对应语言版本；不建也能访问，显示中文

发布后最多 10 分钟出现在站上（首页 1 分钟），见「缓存」。

## 本地开发

```bash
cp .dev.vars.example .dev.vars    # 填好，值和 apps/web 的一样
pnpm --filter gallery dev          # http://localhost:5173
pnpm --filter gallery check        # svelte-check
pnpm --filter gallery test         # 地址解析、Mercator 换算的单测
```

本地用 `wrangler dev` 跑生产构建时注意：adapter 的边缘缓存在本地同样生效，
改完代码重新构建后，同一个 URL 可能还是旧页面，加个查询参数绕开即可。

## 部署

用 Workers Builds（控制台连接 GitHub 仓库），push 到 `main` 自动构建部署。

| 设置 | 值 |
| --- | --- |
| 根目录 | `/`（仓库根，pnpm workspace 要在根目录按 lockfile 安装） |
| 构建命令 | `pnpm turbo run build --filter=gallery` |
| 部署命令 | `pnpm --filter gallery run deploy` |
| 监视路径 | `apps/gallery/*` `packages/database/*` `packages/tsconfig/*` `pnpm-lock.yaml` |

### 运行时变量

| 名称 | 放在哪 |
| --- | --- |
| `BASE_URL` `IMG_PREFIX` `SUPABASE_URL` | `wrangler.jsonc` 的 `vars` |
| `SUPABASE_ANON_KEY` `MAPBOX_TOKEN` | `pnpm exec wrangler secret put <名称>` |

**不要在控制台里设明文变量**：每次 `wrangler deploy` 都会用 `wrangler.jsonc` 覆盖掉它们
（首次上线就因此 500 过）。secret 不受部署影响。

`MAPBOX_TOKEN` 是 `pk.` 开头的公开 token，本来就会出现在浏览器里，在 Mapbox 后台按域名限制即可。

## 实现要点

### 图片

衍生图全部走 Cloudflare Image Transformations：
`${IMG_PREFIX}/cdn-cgi/image/format=auto,quality=82,width=<w>/<storage_key>`，
宽度档位 480 / 960 / 1600 / 2400 / 3200（卡片和缩略图只到 1600）。`format=auto`
按浏览器的 Accept 头返回 AVIF / WebP / JPEG，所以用普通的 `<img srcset>` 就够了。
R2 里的原图在 CMS 上传时已经剥掉 EXIF，变换结果也不带元数据。

首页第一张主图和查看器大图带 `fetchpriority="high"`、不做淡入（淡入要等 JS 水合，
会让手机上的 LCP 晚好几秒）；其余图片懒加载，加载完淡入。

### 地图

| 位置 | 实现 |
| --- | --- |
| 首页足迹（每个相册一个点，可拖动缩放） | Mapbox GL，进入视口才加载 |
| 相册页拍摄地点 | Mapbox 静态图 + SVG 圆点（`src/lib/geo.ts` 做 Mercator 换算，和底图对齐） |
| 查看器信息面板 | Mapbox 静态图 + CSS 准星 |

相册页不用 GL，是因为它在页面靠上的位置，GL 的 500KB+ JS 会让手机主线程阻塞一秒多。

### 缓存

页面响应带 `Cache-Control`，adapter-cloudflare 会把 GET 响应存进边缘缓存（`caches.default`）：

| 页面 | `s-maxage` |
| --- | --- |
| 首页（随机挑相册） | 60 秒 |
| 其他页面 | 600 秒，过期后一天内先回旧页面 |
| `/sitemap.xml` | 3600 秒 |

同一个 isolate 内，相册列表在内存里缓存 60 秒（`listAlbumsWithPhotos`）。

### 字体

Archivo（标题、正文）和 JetBrains Mono（参数）首屏加载。Noto Sans SC 的
`@font-face` 有一百多段，单独打成一个样式表，等页面 `load` 之后空闲时才生效
（`app.html` + `+layout.svelte`），中文先用系统字体显示。

## 已知问题

- **移动端 Lighthouse 性能分在 70–88 之间，没到 90。** 主要原因是 Noto Sans SC：
  每页要下载 0.5–2.3MB 字体分片（决定保留它）。无障碍、SEO 都是 100，CLS 为 0
- `darmau.co` 域名上开着 Zaraz（含 Google Analytics）、机器人防护的 JS 检测和
  Web Analytics，会往页面里注入脚本，影响 Lighthouse 的「最佳实践」分。这些在
  Cloudflare 控制台的域名设置里，不在代码里
- Lighthouse 报一条涉及 SvelteKit 入口脚本的 CSP 提示，响应头里并没有 CSP，原因未查明
- 泰国等地的地址是当地文字（反查服务返回的就是这样），页面照原样显示

## 目录

```
src/
  hooks.server.ts            语言识别、/zh/* 重定向
  lib/
    server/albums.ts         Supabase 查询与归一化（唯一的数据入口）
    server/exif.ts           EXIF 归一化、拍摄时间还原
    server/place.ts          地址 → 地名 / 行政区
    geo.ts                   Mercator 与 fitBounds
    image.ts                 cdn-cgi 地址、srcset
    format.ts                所有等宽参数的显示格式
    i18n/                    三语文案
    components/              Hero 轮播、瀑布流、图注、查看器、地图
  routes/[[lang=lang]]/
    +page                    首页
    albums/+page             全部相册
    albums/[slug]/+page      相册详情
    albums/[slug]/[photoId]  大图查看器（可直接访问、可分享）
  routes/sitemap.xml         三语 sitemap
```

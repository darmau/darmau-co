# Firewood (Shinano Web)

Firewood — also published under its Chinese name “积薪” — is a highly opinionated personal blog that highlights long‑form essays, photo essays, reading notes, and short “thought” snippets. Content is modeled and published from the `cms` app in this monorepo, a SvelteKit admin that writes to Supabase. This repository is the SvelteKit front end that serves the public site from Cloudflare Workers, with Tailwind-driven UI and a heavy emphasis on multilingual publishing (Chinese, English, and Japanese).

The project is intentionally bespoke: it mirrors my own writing workflow, integrates tightly with my media storage, and is not meant to be a generic starter.

## Highlights

- **Multilingual everywhere** – Every page lives under `src/routes/[lang=lang]/`, reads locale strings from `src/lib/locales`, generates `hreflang` tags, and exposes zh/en/jp versions of pages, feeds, and sitemaps. Requests without a language prefix are redirected by `src/hooks.server.ts` based on `Accept-Language`.
- **Multiple content streams** – Long-form articles, photography albums (with EXIF + Mapbox maps), micro “thoughts”, RSS exports, and a public reading log live side by side while sharing Supabase as the data source.
- **Rich reader experience** – Article pages ship a live reading progress bar, table of contents, next/previous navigation, and paginated comments guarded by Cloudflare Turnstile. Photo albums render lightbox galleries, shooting metadata, and location pins.
- **Membership & messaging** – Visitors authenticate via passwordless email magic links or GitHub OAuth, leave comments as guests or authenticated users, and send private messages through the contact form once logged in.
- **Edge-first architecture** – SvelteKit renders on Cloudflare Workers via `@sveltejs/adapter-cloudflare`, Supabase SSR clients are created per request in `hooks.server.ts`, media is served from object storage via `IMG_PREFIX` (Cloudflare Images/R2), and auxiliary tasks (notifications, AI utilities, uploads) are handled by Workers described on `/site`.
- **No UI dependencies** – Menus, popovers, the photo masonry grid, and the album lightbox are all hand-rolled; the only icon assets are plain Svelte components under `src/lib/icons`.
- **Syndication & SEO** – Per-language RSS feeds for articles, photo albums, and thoughts (`src/routes/[lang=lang]/**/rss.xml/+server.ts`), sitemap indexes, and structured meta tags keep the content crawlable.

## Content & Pages

- **Articles** (`src/routes/[lang=lang]/article/[slug]/`): long-form writing with featured images, topics, reading progress, table of contents (`<Catalog />`), Supabase RPC-backed view counters, comment threads, and adjacent post navigation.
- **Thoughts** (`[lang=lang]/thoughts/`): lightweight JSON-based micro posts with “load more” pagination and optional inline imagery.
- **Photography albums** (`[lang=lang]/album/[slug]/`): gallery/lightbox experience, EXIF overlays, Mapbox maps, and location badges. Comments, page views, and tagging mirror the article experience.
- **Bookshelf** (`[lang=lang]/book/`): a reading journal listing ratings, capsule reviews, and outbound links, pulled from Supabase.
- **Meta pages** (`[lang=lang]/about/`, `[lang=lang]/site/`, `[lang=lang]/contact/`): showcase biography content, explain the tech stack, and provide a logged-in contact form that stores submissions in Supabase.
- **Authentication flows** (`[lang=lang]/login/`, `auth/callback/`, `auth/confirm/`): passwordless email magic links and GitHub OAuth built on Supabase Auth.

## Architecture

1. **cms**: A dedicated CMS (SvelteKit + Supabase, `apps/cms` in this monorepo) is used to create content, trigger AI helpers (for translations, summaries, alt text, and slugs), and manage media uploads. The CMS and blog are fully decoupled.
2. **Supabase**: Acts as the primary database, storage metadata layer, and auth provider. `src/hooks.server.ts` creates one SSR client per request and hands it to loads and actions as `locals.supabase`; `locals.safeGetSession()` resolves the session at most once per request.
3. **Cloudflare stack**: `@sveltejs/adapter-cloudflare` emits `.svelte-kit/cloudflare/_worker.js` plus the static assets, both wired up in `wrangler.jsonc`. Runtime secrets arrive on `platform.env` (set with `wrangler secret put`; the repo is public, so nothing lives in `vars`).
4. **Media & maps**: Images are stored in object storage and served through Cloudflare Image Resizing using `IMG_PREFIX`, while Mapbox tokens unlock per-photo maps and EXIF visualizations.
5. **Comments & anti-abuse**: `CommentEditor` enforces Turnstile challenges for anonymous visitors and supports threaded replies/pagination. Authenticated submissions inherit Supabase session context.

## Tech Stack & Integrations

- SvelteKit 2 + Svelte 5 (runes) + Vite + TypeScript
- Cloudflare Workers, Wrangler, and Workers Static Assets
- Tailwind CSS v4 (CSS-first, via `@tailwindcss/vite`)
- Supabase (Postgres, Auth, RPC)
- Tiptap-authored content from the CMS, plus OpenAI-powered utilities (as described on `/site`)
- Mapbox GL for location-aware photography
- Cloudflare Turnstile for form protection
- Resend + Bark notifications for transactional messaging

## Running the Site Locally

Even though this repository is tailored for my deployment, you can boot it for exploration:

```sh
pnpm install
pnpm dev          # vite dev，wrangler 会把 wrangler.jsonc + .dev.vars 代理成 platform.env
pnpm build        # 产出 .svelte-kit/cloudflare
pnpm check        # svelte-check
pnpm dev:cf       # wrangler dev，跑构建产物（更接近线上）
```

Required environment variables live in your Cloudflare project (and `.dev.vars` when emulating locally):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Connect loads/actions to the CMS Supabase instance |
| `IMG_PREFIX` | Base URL for object storage / Cloudflare Image delivery |
| `BASE_URL` | Canonical site origin used in meta tags, RSS, and sitemaps |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile validation for comments/contact |
| `MAPBOX_TOKEN` | Mapbox GL token for album maps & EXIF visualizations |
| `UNSUBSCRIBE_KEY` | Signs unsubscribe links; must match the same secret in `apps/notifier` |

Because Firewood is tightly coupled to my Supabase schema and CMS workflows, adapting it requires mirroring that data model. The `/site` route (and `src/lib/locales/site.ts`) documents the reasoning, architecture choices, and trade-offs if you’re curious about the broader system.

---

If you’re mostly after the CMS experience, see `apps/cms`; if you’re here to read, [firewood (积薪)](https://darmau.co) is the canonical deployment powered by this codebase.

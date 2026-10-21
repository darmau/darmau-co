<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import PhotoFigure from '$lib/components/PhotoFigure.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import AlbumRouteMap from '$lib/components/maps/AlbumRouteMap.svelte';
	import * as f from '$lib/format';
	import { fmt, localize } from '$lib/i18n';
	import { ogImageUrl } from '$lib/image';
	import type { Photo } from '$lib/types';

	let { data } = $props();

	const t = $derived(data.t);
	const album = $derived(data.album);

	// 排版节奏：整幅 → 两张并排 → 整幅 → …；最后剩单张时按整幅排
	const rows = $derived.by(() => {
		const out: Photo[][] = [];
		let i = 0;
		while (i < album.photos.length) {
			const size = out.length % 2 === 0 ? 1 : 2;
			out.push(album.photos.slice(i, i + size));
			i += size;
		}
		return out;
	});

	const subtitle = $derived(
		[album.place?.name, album.dateRange && f.yearMonth(album.dateRange.start)].filter(Boolean).join(' · ')
	);

	const altitude = $derived.by(() => {
		const r = album.altitudeRange;
		if (!r) return null;
		const [lo, hi] = r.map((m) => Math.round(m));
		return lo === hi ? `${lo} m` : `${lo} – ${hi} m`;
	});

	const description = $derived(
		album.abstract ?? [subtitle, fmt(t.photos, { n: album.photoCount })].filter(Boolean).join(' · ')
	);
</script>

<Seo
	title={`${album.title} — ${t.siteName}`}
	{description}
	image={ogImageUrl(data.imgPrefix, album.cover.storageKey)}
	type="article"
/>

<Nav />

<main>
	<header class="intro">
		<div class="text" lang={album.fallback ? 'zh-CN' : undefined}>
			<p class="label"><span class="accent">No.{f.pad(album.no, 3)}</span> · {fmt(t.photos, { n: album.photoCount })}</p>
			<h1>{album.title}</h1>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
			{#if album.fallback}<p class="fallback label" lang={data.lang}>{t.album.fallback}</p>{/if}
			{#if album.descriptionHtml}
				<!-- CMS 后台（仅管理员可写）产出的 HTML，和博客相册页同一来源 -->
				<div class="prose">{@html album.descriptionHtml}</div>
			{:else if album.abstract}
				<p class="prose">{album.abstract}</p>
			{/if}
		</div>

		<aside class="side" aria-label={t.album.info}>
			<AlbumRouteMap photos={album.photos} token={data.mapboxToken} />
			<dl class="facts">
				{#if album.place}
					<div><dt class="label">{t.album.place}</dt><dd>{album.place.name}{album.place.region ? ` · ${album.place.region}` : ''}</dd></div>
				{/if}
				{#if album.dateRange}
					<div><dt class="label">{t.album.dates}</dt><dd class="mono">{f.dateRange(album.dateRange)}</dd></div>
				{/if}
				<div><dt class="label">{t.album.count}</dt><dd class="mono">{album.photoCount}</dd></div>
				{#if altitude}
					<div><dt class="label">{t.album.altitude}</dt><dd class="mono">{altitude}</dd></div>
				{/if}
				{#if album.gear.cameras.length || album.gear.lenses.length}
					<div>
						<dt class="label">{t.album.gear}</dt>
						<dd>
							<ul class="gear">
								{#each album.gear.cameras as camera (camera)}<li>{camera}</li>{/each}
								{#each album.gear.lenses as lens (lens)}<li class="mono lens">{lens}</li>{/each}
							</ul>
						</dd>
					</div>
				{/if}
			</dl>
		</aside>
	</header>

	<div class="photos">
		{#each rows as row, r (r)}
			{#if row.length === 1}
				<div class="row full">
					<PhotoFigure photo={row[0]!} sizes="100vw" />
				</div>
			{:else}
				<div class="row pair">
					{#each row as photo (photo.id)}
						<PhotoFigure {photo} sizes="(max-width: 640px) 100vw, 50vw" />
					{/each}
				</div>
			{/if}
		{/each}
	</div>

	<nav class="after" aria-label={t.album.next}>
		<a class="back" href={localize(data.lang, '/albums')}><span aria-hidden="true">←</span> {t.album.backAll}</a>
		{#if data.next}
			<a class="next" href={localize(data.lang, `/albums/${data.next.slug}`)}>
				<span class="next-text">
					<span class="label">{t.album.next}</span>
					<span class="next-title">{data.next.title}</span>
					<span class="mono next-count">{fmt(t.photos, { n: data.next.photoCount })}</span>
				</span>
				<span class="thumb"><Picture image={data.next.cover} sizes="240px" fit="cover" /></span>
			</a>
		{/if}
	</nav>
</main>

<Footer />

<style>
	.intro {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr);
		gap: 48px var(--page-x);
		padding: 64px var(--page-x) 72px;
	}

	.text {
		display: grid;
		align-content: start;
		gap: 18px;
	}

	h1 {
		font-size: clamp(48px, 7vw, 112px);
		font-weight: 700;
		font-stretch: 112%;
		line-height: 0.92;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.subtitle {
		font-size: 18px;
		color: var(--text-2);
	}

	.fallback {
		text-transform: none;
		letter-spacing: 0.04em;
	}

	.prose {
		max-width: 62ch;
		color: var(--text-2);
		font-size: 16px;
		line-height: 1.8;
	}

	.prose :global(p + p) {
		margin-top: 1em;
	}

	.prose :global(a) {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--line);
	}

	.side {
		display: grid;
		align-content: start;
		gap: 24px;
	}

	.facts {
		margin: 0;
		border-top: 1px solid var(--line);
	}

	.facts > div {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	dd {
		margin: 0;
		font-size: 14px;
	}

	.gear {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 4px;
	}

	.lens {
		font-size: 11px;
		color: var(--muted);
	}

	.photos {
		display: grid;
		gap: 48px;
		padding: 0 var(--gutter);
	}

	/* 整幅：竖图不能撑满宽度，否则一张图要滚好几屏，按视口高度收窄并居中 */
	.full :global(figure) {
		width: min(100%, calc(88svh * var(--ratio)));
		margin-inline: auto;
	}

	/* 并排：flex-grow 与宽高比成正比，两张图自然等高；窄屏换行 */
	.pair {
		display: flex;
		flex-wrap: wrap;
		gap: 48px var(--gutter);
	}

	.pair :global(figure) {
		flex: calc(var(--ratio) * 100) 1 0;
		min-width: 300px;
	}

	.after {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		justify-content: space-between;
		gap: 24px;
		margin-top: 96px;
		padding: 32px var(--page-x);
		border-top: 1px solid var(--line);
	}

	.back {
		align-self: center;
		font-size: 14px;
		color: var(--text-2);
	}

	.back:hover {
		color: var(--text);
	}

	.next {
		display: flex;
		align-items: center;
		gap: 20px;
		text-align: right;
	}

	.next-text {
		display: grid;
		gap: 4px;
	}

	.next-title {
		font-size: 24px;
		font-weight: 650;
		line-height: 1.15;
	}

	.next-count {
		font-size: 11px;
		color: var(--accent);
	}

	.thumb {
		display: block;
		width: 160px;
		aspect-ratio: 3 / 2;
		overflow: hidden;
	}

	.thumb :global(img) {
		transition: transform 0.6s var(--ease);
	}

	.next:hover .thumb :global(img) {
		transform: scale(1.04);
	}

	@media (max-width: 900px) {
		.intro {
			grid-template-columns: 1fr;
			padding-top: 40px;
		}
	}

	@media (max-width: 640px) {
		.pair :global(figure) {
			min-width: 100%;
		}

		.thumb {
			width: 112px;
		}
	}
</style>

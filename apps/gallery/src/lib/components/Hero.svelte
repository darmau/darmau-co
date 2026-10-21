<script lang="ts">
	import { page } from '$app/state';
	import { getImgPrefix } from '$lib/context';
	import * as f from '$lib/format';
	import { fmt, localize, type Lang } from '$lib/i18n';
	import { srcset } from '$lib/image';
	import type { AlbumSummary } from '$lib/types';
	import Picture from './Picture.svelte';

	let { album }: { album: AlbumSummary } = $props();

	const lang = $derived(page.data.lang as Lang);
	const t = $derived(page.data.t);
	const prefix = getImgPrefix();
	const cover = $derived(album.cover);
	const href = $derived(localize(lang, `/albums/${album.slug}`));
	const exifCells = $derived(
		[
			[t.exif.focal, f.focal(cover.exif)],
			[t.exif.aperture, f.aperture(cover.exif.aperture)],
			[t.exif.shutter, f.shutter(cover.exif.exposureTime)],
			[t.exif.iso, cover.exif.iso === null ? null : String(cover.exif.iso)]
		].filter((cell): cell is [string, string] => !!cell[1])
	);
</script>

<svelte:head>
	<!-- 首屏主图：和 <img> 用同一组 srcset/sizes，浏览器只会下载一份 -->
	<link
		rel="preload"
		as="image"
		imagesrcset={srcset(prefix, cover.storageKey, cover.width)}
		imagesizes="100vw"
		fetchpriority="high"
	/>
</svelte:head>

<section class="hero">
	<Picture image={cover} sizes="100vw" fit="cover" priority class="hero-image" />
	<div class="scrim" aria-hidden="true"></div>

	<div class="content">
		<div class="lead">
			<p class="label kicker">
				{album.pinned ? t.hero.pinned : t.hero.latest} — <span class="accent">{fmt(t.photos, { n: album.photoCount })}</span>
			</p>
			<h1>{album.title}</h1>
			{#if album.abstract}
				<p class="abstract">{album.abstract}</p>
			{/if}
			<div class="actions">
				<a class="btn" {href}>{t.hero.enter} <span aria-hidden="true">→</span></a>
				{#if album.place || album.center}
					<p class="where mono">
						{#if album.place}<span>{album.place.name}</span>{/if}
						{#if album.center}<span class="accent">{f.coord(album.center, 2)}</span>{/if}
					</p>
				{/if}
			</div>
		</div>

		{#if exifCells.length || cover.exif.camera}
			<aside class="exif-card" aria-label={t.hero.exif}>
				{#if cover.exif.camera}<p class="camera">{cover.exif.camera}</p>{/if}
				{#if cover.exif.lens}<p class="lens mono">{cover.exif.lens}</p>{/if}
				<dl>
					{#each exifCells as [term, value] (term)}
						<div>
							<dt class="label">{term}</dt>
							<dd class="mono">{value}</dd>
						</div>
					{/each}
				</dl>
				{#if cover.takenAt}<p class="taken mono">{f.fullDateTime(cover.takenAt)}</p>{/if}
			</aside>
		{/if}
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 820px;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		isolation: isolate;
	}

	.hero :global(.hero-image) {
		position: absolute;
		inset: 0;
		z-index: -2;
	}

	/* 唯一允许的渐变：保证底部文字可读 */
	.scrim {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(to top, rgb(7 7 7 / 0.92) 0%, rgb(7 7 7 / 0.62) 40%, rgb(7 7 7 / 0.2) 72%, transparent 88%);
	}

	.content {
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 40px;
		padding: 0 var(--page-x) 56px;
	}

	.lead {
		max-width: 860px;
		display: grid;
		gap: 20px;
	}

	.kicker {
		color: var(--text-2);
	}

	h1 {
		font-size: clamp(64px, 10vw, 148px);
		font-weight: 700;
		font-stretch: 112%;
		line-height: 0.9;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.abstract {
		max-width: 560px;
		color: var(--text-2);
		font-size: 17px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px 28px;
		margin-top: 8px;
	}

	.where {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--text-2);
	}

	.exif-card {
		flex: 0 0 300px;
		display: grid;
		gap: 6px;
		padding: 20px;
		border: 1px solid rgb(237 235 230 / 0.14);
		background: rgb(12 12 11 / 0.5);
		backdrop-filter: blur(18px) saturate(1.2);
		-webkit-backdrop-filter: blur(18px) saturate(1.2);
	}

	.camera {
		font-size: 15px;
		font-weight: 600;
	}

	.lens {
		font-size: 11px;
		color: var(--muted);
	}

	dl {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px 12px;
		margin: 12px 0 0;
		padding-top: 14px;
		border-top: 1px solid rgb(237 235 230 / 0.14);
	}

	dd {
		margin: 2px 0 0;
		font-size: 18px;
	}

	.taken {
		margin-top: 10px;
		font-size: 11px;
		color: var(--muted);
	}

	@media (max-width: 900px) {
		.hero {
			min-height: 100svh;
		}

		.content {
			flex-direction: column;
			align-items: stretch;
			padding-bottom: 32px;
		}

		.exif-card {
			flex-basis: auto;
		}
	}
</style>

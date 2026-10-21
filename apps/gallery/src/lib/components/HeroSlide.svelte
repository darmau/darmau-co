<script lang="ts">
	import { page } from '$app/state';
	import * as f from '$lib/format';
	import { fmt, localize, type Lang } from '$lib/i18n';
	import type { AlbumSummary } from '$lib/types';
	import Picture from './Picture.svelte';

	interface Props {
		album: AlbumSummary;
		/** 第几张，1 起 */
		n: number;
		total: number;
		active: boolean;
		/** 第一张：最高优先级、不淡入；其余等页面加载完才请求图片 */
		priority: boolean;
		loadImage: boolean;
	}

	let { album, n, total, active, priority, loadImage }: Props = $props();

	const lang = $derived(page.data.lang as Lang);
	const t = $derived(page.data.t);
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

<!-- 不在当前位置的幻灯片：读屏跳过、链接不可聚焦 -->
<div
	class="slide"
	class:active
	role="group"
	aria-roledescription="slide"
	aria-label={fmt(t.hero.slide, { n, total })}
	aria-hidden={!active}
	inert={!active}
>
	{#if loadImage}
		<Picture image={cover} sizes="100vw" fit="cover" {priority} class="hero-image" />
	{/if}
	<div class="scrim" aria-hidden="true"></div>

	<div class="content">
		<div class="lead">
			<p class="label kicker">
				{t.hero.pinned} — <span class="accent">{fmt(t.photos, { n: album.photoCount })}</span>
			</p>
			<!-- 三张轮播各有一个标题，用 h2；页面的 h1 是站名 -->
			<h2 class="title" lang={album.fallback ? 'zh-CN' : undefined}>{album.title}</h2>
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
</div>

<style>
	/* 三张叠在同一个网格单元里，轮播高度取最高的一张，不会因为文字多少而溢出 */
	.slide {
		grid-area: 1 / 1;
		position: relative;
		min-height: 820px;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		isolation: isolate;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 1.2s var(--ease),
			visibility 0s linear 1.2s;
	}

	.slide.active {
		opacity: 1;
		visibility: visible;
		transition:
			opacity 1.2s var(--ease),
			visibility 0s;
	}

	.slide :global(.hero-image) {
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
		/* 底部留出轮播指示器的位置，见 Hero.svelte */
		padding: 0 var(--page-x) 112px;
	}

	.lead {
		max-width: 860px;
		display: grid;
		gap: 20px;
	}

	.kicker {
		color: var(--text-2);
	}

	.title {
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
		font-size: 12px;
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
		font-size: 12px;
		color: var(--muted);
	}

	@media (max-width: 900px) {
		.slide {
			min-height: 100svh;
		}

		.content {
			flex-direction: column;
			align-items: stretch;
			padding-bottom: 88px;
		}

		.exif-card {
			flex-basis: auto;
		}
	}
</style>

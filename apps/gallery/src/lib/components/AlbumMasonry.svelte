<script lang="ts">
	import { page } from '$app/state';
	import * as f from '$lib/format';
	import { fmt, localize, type Lang } from '$lib/i18n';
	import type { AlbumSummary } from '$lib/types';
	import Picture from './Picture.svelte';

	interface Props {
		albums: AlbumSummary[];
		/** 传入时最后一格显示「浏览全部相册」入口 */
		total?: number;
	}

	let { albums, total }: Props = $props();

	const lang = $derived(page.data.lang as Lang);
	const t = $derived(page.data.t);
</script>

<ul class="masonry">
	{#each albums as album (album.slug)}
		<li>
			<a class="card" href={localize(lang, `/albums/${album.slug}`)}>
				<Picture
					image={album.cover}
					sizes="(max-width: 800px) 100vw, (max-width: 1200px) 50vw, 33vw"
					class="card-image"
				/>
				<div class="info">
					<p class="meta mono accent">No.{f.pad(album.no, 3)} · {fmt(t.photos, { n: album.photoCount })}</p>
					<h3 lang={album.fallback ? 'zh' : undefined}>{album.title}</h3>
					{#if album.place}<p class="place">{album.place.name}{album.place.region ? ` · ${album.place.region}` : ''}</p>{/if}
					<p class="foot mono">
						<span>{album.center ? f.coord(album.center, 2) : ''}</span>
						<span>{album.dateRange ? f.yearMonth(album.dateRange.start) : ''}</span>
					</p>
				</div>
			</a>
		</li>
	{/each}

	{#if total !== undefined && total > albums.length}
		<li>
			<a class="more" href={localize(lang, '/albums')}>
				<span class="more-title">{t.browseAll}</span>
				<span class="mono more-count">{fmt(t.shownOf, { shown: albums.length, total })}</span>
				<span class="arrow" aria-hidden="true">→</span>
			</a>
		</li>
	{/if}
</ul>

<style>
	.masonry {
		columns: 3 380px;
		column-gap: var(--gutter);
		list-style: none;
		margin: 0;
		padding: 0 var(--gutter);
	}

	li {
		break-inside: avoid;
		margin-bottom: var(--gutter);
	}

	.card {
		position: relative;
		display: block;
		overflow: hidden;
		outline-offset: 0;
	}

	.card :global(.card-image img) {
		transition:
			transform 0.7s var(--ease),
			filter 0.5s var(--ease),
			opacity 0.6s var(--ease);
	}

	/* 悬停 / 键盘聚焦一张时，其他卡片压暗 */
	.masonry:has(.card:hover, .card:focus-visible) .card:not(:hover, :focus-visible) :global(.card-image img) {
		filter: brightness(0.5);
	}

	.card:hover :global(.card-image img),
	.card:focus-visible :global(.card-image img) {
		transform: scale(1.03);
	}

	.info {
		position: absolute;
		inset: auto 0 0;
		display: grid;
		gap: 4px;
		padding: 96px 20px 18px;
		background: linear-gradient(to top, rgb(7 7 7 / 0.94), rgb(7 7 7 / 0.72) 50%, transparent);
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.4s var(--ease),
			transform 0.5s var(--ease);
	}

	.card:hover .info,
	.card:focus-visible .info {
		opacity: 1;
		transform: none;
	}

	.meta {
		font-size: 11px;
		letter-spacing: 0.08em;
	}

	h3 {
		font-size: 24px;
		font-weight: 650;
		line-height: 1.15;
	}

	.place {
		font-size: 13px;
		color: var(--text-2);
	}

	.foot {
		display: flex;
		justify-content: space-between;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid rgb(237 235 230 / 0.2);
		font-size: 11px;
		color: var(--text-2);
	}

	/* 触屏没有悬停，信息常显 */
	@media (hover: none) {
		.info {
			opacity: 1;
			transform: none;
		}
	}

	.more {
		display: grid;
		gap: 10px;
		align-content: end;
		min-height: 260px;
		padding: 28px;
		border: 1px solid var(--line);
		background: var(--surface);
		transition: border-color 0.3s var(--ease);
	}

	.more:hover {
		border-color: var(--text-2);
	}

	.more-title {
		font-size: 28px;
		font-weight: 650;
		font-stretch: 112%;
		line-height: 1.1;
	}

	.more-count {
		font-size: 12px;
		color: var(--accent);
	}

	.arrow {
		font-size: 28px;
		transition: transform 0.3s var(--ease);
	}

	.more:hover .arrow {
		transform: translateX(6px);
	}
</style>

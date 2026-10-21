<script lang="ts">
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { getImgPrefix } from '$lib/context';
	import { pad } from '$lib/format';
	import { fmt, localize, type Lang } from '$lib/i18n';
	import { imageUrl, srcset } from '$lib/image';
	import type { Photo } from '$lib/types';
	import Picture from '../Picture.svelte';
	import InfoPanel from './InfoPanel.svelte';

	interface Props {
		slug: string;
		photos: Photo[];
		/** 0 起的初始位置 */
		start: number;
		token: string;
		/** 当前位置变化时通知页面（更新 <title> 等） */
		onchange?: (index: number) => void;
	}

	let { slug, photos, start, token, onchange }: Props = $props();

	const lang = $derived(page.data.lang as Lang);
	const t = $derived(page.data.t);
	const prefix = getImgPrefix();

	// svelte-ignore state_referenced_locally
	let index = $state(start);
	let panelOpen = $state(true);
	let strip = $state<HTMLElement>();

	const photo = $derived(photos[index]!);
	const hasPrev = $derived(index > 0);
	const hasNext = $derived(index < photos.length - 1);
	const albumHref = $derived(localize(lang, `/albums/${slug}`));
	const closeHref = $derived(`${albumHref}#photo-${photo.index}`);
	const sizes = $derived(panelOpen ? '(max-width: 900px) 100vw, calc(100vw - 340px)' : '100vw');

	function go(next: number) {
		if (next < 0 || next >= photos.length || next === index) return;
		index = next;
		// 不新增历史记录：浏览器「后退」直接回到相册页，而不是一张张往回翻
		replaceState(localize(lang, `/albums/${slug}/${photos[next]!.id}`), {});
		onchange?.(next);
	}

	const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// 预加载前后各一张，用和舞台一样的 srcset/sizes，浏览器会选中同一个档位直接复用
	$effect(() => {
		for (const p of [photos[index - 1], photos[index + 1]]) {
			if (!p) continue;
			const img = new Image();
			img.sizes = sizes;
			img.srcset = srcset(prefix, p.storageKey, p.width);
		}
	});

	// 当前缩略图滚到胶片条中间
	$effect(() => {
		void index;
		strip
			?.querySelector('[aria-current="true"]')
			?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
		switch (e.key) {
			case 'ArrowLeft':
				go(index - 1);
				break;
			case 'ArrowRight':
				go(index + 1);
				break;
			case 'Escape':
				goto(closeHref);
				break;
			case 'i':
			case 'I':
				panelOpen = !panelOpen;
				break;
			default:
				return;
		}
		e.preventDefault();
	}

	// 手机左右滑动翻页；竖向滑动（滚动页面）不算
	let touch: { x: number; y: number } | null = null;
	function ontouchstart(e: TouchEvent) {
		const p = e.touches[0];
		touch = p && e.touches.length === 1 ? { x: p.clientX, y: p.clientY } : null;
	}
	function ontouchend(e: TouchEvent) {
		const p = e.changedTouches[0];
		if (!touch || !p) return;
		const dx = p.clientX - touch.x;
		const dy = p.clientY - touch.y;
		touch = null;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? index + 1 : index - 1);
	}
</script>

<svelte:window {onkeydown} />

<div class="viewer" class:panel-open={panelOpen}>
	<header class="bar">
		<a class="back" href={albumHref}><span aria-hidden="true">←</span> {t.viewer.back}</a>
		<p class="counter mono" aria-live="polite">
			<span class="accent">{pad(photo.index)}</span> / {pad(photos.length)}
		</p>
		<div class="actions">
			<button
				class="icon"
				aria-pressed={panelOpen}
				aria-label={t.viewer.info}
				title={`${t.viewer.info} (I)`}
				onclick={() => (panelOpen = !panelOpen)}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg
				>
			</button>
			<a class="icon" href={closeHref} aria-label={t.viewer.close} title={`${t.viewer.close} (Esc)`}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
			</a>
		</div>
	</header>

	<!-- 左右滑动只是触屏上的增强，键盘和翻页按钮提供同样的操作 -->
	<div class="stage" role="group" aria-label={fmt(t.viewer.photoN, { n: photo.index })} {ontouchstart} {ontouchend}>
		{#key photo.id}
			<Picture image={photo} {sizes} fit="contain" priority class="stage-image" />
		{/key}
		<button class="nav prev" aria-label={t.viewer.prev} disabled={!hasPrev} onclick={() => go(index - 1)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
		</button>
		<button class="nav next" aria-label={t.viewer.next} disabled={!hasNext} onclick={() => go(index + 1)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
		</button>
	</div>

	<nav class="strip" aria-label={t.viewer.filmstrip} bind:this={strip}>
		{#each photos as p, i (p.id)}
			<button
				class="thumb"
				aria-label={fmt(t.viewer.photoN, { n: p.index })}
				aria-current={i === index ? 'true' : undefined}
				style:aspect-ratio={`${p.width} / ${p.height}`}
				onclick={() => go(i)}
			>
				<img src={imageUrl(prefix, p.storageKey, 240, 60)} alt="" loading="lazy" decoding="async" />
			</button>
		{/each}
	</nav>

	{#if panelOpen}
		<aside class="info" aria-label={t.viewer.info}>
			<InfoPanel {photo} total={photos.length} {token} />
			<p class="shortcuts mono">{t.viewer.shortcuts}</p>
		</aside>
	{/if}
</div>

<style>
	.viewer {
		--panel: 340px;
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr) auto;
		background: var(--viewer-bg);
	}

	.viewer.panel-open {
		grid-template-columns: minmax(0, 1fr) var(--panel);
	}

	.bar {
		grid-column: 1;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px 12px 24px;
	}

	.back {
		font-size: 13px;
		color: var(--text-2);
	}

	.back:hover {
		color: var(--text);
	}

	.counter {
		margin: 0 auto;
		font-size: 13px;
		color: var(--muted);
	}

	.actions {
		display: flex;
		gap: 4px;
	}

	.icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		color: var(--text-2);
		border: 1px solid transparent;
	}

	.icon:hover {
		color: var(--text);
	}

	.icon[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--line);
	}

	svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.stage {
		grid-column: 1;
		position: relative;
		min-height: 0;
		padding: 0 72px;
		touch-action: pan-y;
	}

	.stage :global(.stage-image) {
		animation: fade 0.35s var(--ease);
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	.nav {
		position: absolute;
		top: 50%;
		display: grid;
		place-items: center;
		width: 48px;
		height: 72px;
		margin-top: -36px;
		color: var(--text-2);
		transition: color 0.2s var(--ease);
	}

	.nav:hover:not(:disabled) {
		color: var(--text);
	}

	.nav:disabled {
		opacity: 0.2;
		cursor: default;
	}

	.nav svg {
		width: 28px;
		height: 28px;
	}

	.prev {
		left: 12px;
	}

	.next {
		right: 12px;
	}

	.strip {
		grid-column: 1;
		display: flex;
		gap: 6px;
		height: 76px;
		padding: 10px 24px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.thumb {
		flex: none;
		height: 100%;
		max-width: 120px;
		opacity: 0.4;
		outline: 1px solid transparent;
		outline-offset: 2px;
		transition: opacity 0.2s var(--ease);
	}

	.thumb:hover {
		opacity: 0.75;
	}

	.thumb[aria-current='true'] {
		opacity: 1;
		outline-color: var(--accent);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.info {
		grid-column: 2;
		grid-row: 1 / -1;
		overflow-y: auto;
		background: var(--bg);
		border-left: 1px solid var(--line);
	}

	.shortcuts {
		padding: 16px 24px 24px;
		font-size: 10px;
		color: var(--muted);
	}

	/* 窄屏：不再固定满屏，信息面板排到图片下方，整页滚动 */
	@media (max-width: 900px) {
		.viewer,
		.viewer.panel-open {
			position: static;
			min-height: 100svh;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto;
		}

		.stage {
			height: 72svh;
			padding: 0;
		}

		.nav {
			display: none;
		}

		.info {
			grid-column: 1;
			grid-row: auto;
			border-left: 0;
			border-top: 1px solid var(--line);
		}

		.shortcuts {
			display: none;
		}
	}
</style>

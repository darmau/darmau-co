<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getImgPrefix } from '$lib/context';
	import { pad } from '$lib/format';
	import { fmt } from '$lib/i18n';
	import { srcset } from '$lib/image';
	import type { AlbumSummary } from '$lib/types';
	import HeroSlide from './HeroSlide.svelte';

	// 首页主图：随机精选相册轮播，渐隐切换。
	// 自动切换由当前指示器上的进度条动画驱动（animationend 时切下一张），
	// 暂停就是暂停这条动画，计时和视觉永远同步。

	let { albums }: { albums: AlbumSummary[] } = $props();

	const t = $derived(page.data.t);
	const prefix = getImgPrefix();
	const first = $derived(albums[0]!.cover);

	let current = $state(0);
	/** 挂载后才开启；系统开了「减少动态效果」则不自动切换 */
	let autoplay = $state(false);
	/** 用户点了暂停 */
	let paused = $state(false);
	/** 鼠标悬停或键盘焦点在轮播里时临时暂停 */
	let holding = $state(false);
	/** 页面加载完之后才请求后两张图，不和首屏抢带宽 */
	let ready = $state(false);

	const running = $derived(autoplay && !paused && !holding);

	onMount(() => {
		autoplay = albums.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (document.readyState === 'complete') ready = true;
		else addEventListener('load', () => (ready = true), { once: true });
	});

	function go(i: number) {
		ready = true;
		current = (i + albums.length) % albums.length;
	}

	function onfocusout(e: FocusEvent) {
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) holding = false;
	}
</script>

<svelte:head>
	<!-- 第一张主图：和 <img> 用同一组 srcset/sizes，浏览器只会下载一份 -->
	<link rel="preload" as="image" imagesrcset={srcset(prefix, first.storageKey, first.width)} imagesizes="100vw" fetchpriority="high" />
</svelte:head>

<section
	class="hero"
	aria-roledescription="carousel"
	aria-label={t.hero.carousel}
	onmouseenter={() => (holding = true)}
	onmouseleave={() => (holding = false)}
	onfocusin={() => (holding = true)}
	{onfocusout}
>
	{#each albums as album, i (album.slug)}
		<HeroSlide
			{album}
			n={i + 1}
			total={albums.length}
			active={i === current}
			priority={i === 0}
			loadImage={i === 0 || ready}
		/>
	{/each}

	{#if albums.length > 1}
		<div class="controls">
			{#each albums as album, i (album.slug)}
				<button
					class="dot"
					aria-label={fmt(t.hero.goTo, { n: i + 1 })}
					aria-current={i === current ? 'true' : undefined}
					onclick={() => go(i)}
				>
					<span class="mono num">{pad(i + 1)}</span>
					<span class="track">
						{#if i === current && autoplay}
							{#key current}
								<span
									class="progress"
									style:animation-play-state={running ? 'running' : 'paused'}
									onanimationend={() => go(current + 1)}
								></span>
							{/key}
						{/if}
					</span>
				</button>
			{/each}
			{#if autoplay}
				<button class="toggle" aria-label={paused ? t.hero.play : t.hero.pause} onclick={() => (paused = !paused)}>
					{#if paused}
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>
					{:else}
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
					{/if}
				</button>
			{/if}
		</div>
	{/if}
</section>

<style>
	.hero {
		position: relative;
		display: grid;
	}

	.controls {
		position: absolute;
		left: var(--page-x);
		bottom: 32px;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.dot {
		display: grid;
		gap: 8px;
		padding: 8px 6px;
		text-align: left;
	}

	.num {
		font-size: 12px;
		color: var(--muted);
		transition: color 0.2s var(--ease);
	}

	.dot:hover .num,
	.dot[aria-current] .num {
		color: var(--accent);
	}

	.track {
		position: relative;
		display: block;
		width: 48px;
		height: 2px;
		background: rgb(237 235 230 / 0.25);
		overflow: hidden;
	}

	.dot[aria-current] .track {
		background: rgb(237 235 230 / 0.4);
	}

	.progress {
		position: absolute;
		inset: 0;
		background: var(--accent);
		transform-origin: left;
		animation: progress 7s linear forwards;
	}

	@keyframes progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	.toggle {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		margin-left: 8px;
		color: var(--text-2);
	}

	.toggle:hover {
		color: var(--text);
	}

	.toggle svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	@media (max-width: 900px) {
		.controls {
			bottom: 24px;
		}
	}
</style>

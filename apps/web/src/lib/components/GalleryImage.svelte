<script lang="ts">
	import { onMount } from 'svelte';
	import { getSiteContext } from '$lib/context';
	import type { GalleryPhoto } from '$lib/utils/generatePhotoAlbum';

	let {
		image,
		width,
		classList
	}: { image: GalleryPhoto; width: number; classList: string } = $props();

	const site = getSiteContext();

	let imageLoaded = $state(false);
	let imgEl: HTMLImageElement | null = $state(null);

	// 横图按宽度缩放，竖图按高度缩放
	const base = $derived(image.width > image.height ? 'width' : 'height');

	// 图片可能在 hydrate 之前就已经从缓存里加载完，此时不会再触发 load 事件
	onMount(() => {
		if (imgEl && imgEl.complete) {
			imageLoaded = true;
		}
	});

	const highResSrc = $derived(
		`${site.prefix}/cdn-cgi/image/format=auto,${base}=${width}/${image.storage_key}`
	);
	const highResSrcSet = $derived(
		`${highResSrc} 1x, ${site.prefix}/cdn-cgi/image/format=auto,${base}=${width * 2}/${image.storage_key} 2x`
	);
	// 原 React 版本这里的模板字符串多写了一个 `}`（`${base}=24}`），会请求到一个非法尺寸，这里修正
	const lowResSrc = $derived(
		`${site.prefix}/cdn-cgi/image/format=auto,${base}=24/${image.storage_key}`
	);

	// 防 CLS：调用方给了 aspect-* 就听它的（内联样式会盖过 class），
	// 没给才用原始宽高兜底，否则图片加载前后会抖动
	const ratio = $derived(
		classList.includes('aspect-') || !image.width || !image.height
			? undefined
			: `aspect-ratio: ${image.width} / ${image.height}`
	);
</script>

<div class="{classList} relative overflow-hidden" style={ratio}>
	<!-- 低分辨率模糊占位图。和高清图是同一张，共用 alt 会让读屏把每张图念两遍，这里对无障碍树隐藏 -->
	<img
		class="scale-110 brightness-110 absolute inset-0 transition-opacity duration-300 {imageLoaded
			? 'opacity-0'
			: 'opacity-100'}"
		src={lowResSrc}
		alt=""
		aria-hidden="true"
		{width}
		style="filter: blur(32px)"
	/>

	<!-- 高分辨率图片。sizes 原来写的是 "2x"，那是密度描述符不是长度，整条会被浏览器丢弃 -->
	<picture class="transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-0'}">
		<source media="(max-width: 639px)" srcset={highResSrc} />
		<source media="(min-width: 640px)" srcset={highResSrcSet} />
		<img
			bind:this={imgEl}
			class="group-hover:scale-105 transition-all duration-300"
			src={highResSrc}
			srcset={highResSrcSet}
			sizes="(max-width: 720px) 100vw, {width}px"
			alt={image.alt ?? ''}
			{width}
			loading="lazy"
			decoding="async"
			onload={() => (imageLoaded = true)}
		/>
	</picture>
</div>

<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import type { Image } from '$lib/types/Image';

	let {
		image,
		width,
		classList
	}: { image: Image; width: number; classList: string } = $props();

	const site = getSiteContext();

	let imageLoaded = $state(false);

	// 横图按宽度缩放，竖图按高度缩放
	const base = $derived(image.width > image.height ? 'width' : 'height');
	const highResSrc = $derived(
		`${site.prefix}/cdn-cgi/image/format=auto,${base}=${width}/${image.storage_key}`
	);
	const highResSrcSet = $derived(
		`${highResSrc} 1x, ${site.prefix}/cdn-cgi/image/format=auto,${base}=${width * 2}/${image.storage_key} 2x`
	);

	// 防 CLS 原本完全依赖调用方在 classList 里传 aspect-*，漏传就抖动。
	// 调用方给了比例就听它的（内联样式会盖过 class，所以要显式让位），
	// 没给才用 CMS 存的原始宽高兜底。
	const ratio = $derived(
		classList.includes('aspect-') || !image.width || !image.height
			? undefined
			: `aspect-ratio: ${image.width} / ${image.height}`
	);
</script>

<div class="{classList} relative overflow-hidden" style={ratio}>
	<!-- 低分辨率占位图，高清图加载完后淡出。
	     它和高清图是同一张图，共用 alt 会让读屏把每张图念两遍，所以这里彻底对无障碍树隐藏。 -->
	<img
		class="scale-105 brightness-110 absolute inset-0 w-full h-full object-cover transition-opacity duration-300 {imageLoaded
			? 'opacity-0'
			: 'opacity-100'}"
		src="{site.prefix}/cdn-cgi/image/format=jpeg,{base}=24/{image.storage_key}"
		alt=""
		aria-hidden="true"
		{width}
		style="filter: blur(32px)"
	/>

	<!-- sizes 原来写的是 "2x"，那是 srcset 的密度描述符，不是合法的 sizes 值，
	     整条 sizes 会被浏览器丢弃。宽屏下这张图就按 width 渲染，直接写成长度。 -->
	<picture class="transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-0'}">
		<source media="(max-width: 639px)" srcset={highResSrc} />
		<source media="(min-width: 640px)" srcset={highResSrcSet} />
		<img
			class="group-hover:scale-105 w-full h-full object-cover transition-all duration-300"
			src={highResSrc}
			srcset={highResSrcSet}
			sizes="(max-width: 720px) 100vw, {width}px"
			alt={image.alt ?? ''}
			{width}
			loading="lazy"
			decoding="async"
			onload={() => (imageLoaded = true)}
			onerror={() => (imageLoaded = true)}
		/>
	</picture>
</div>

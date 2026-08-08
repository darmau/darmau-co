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
</script>

<div class="{classList} relative overflow-hidden">
	<!-- 低分辨率占位图，高清图加载完后淡出 -->
	<img
		class="scale-105 brightness-110 absolute inset-0 w-full h-full object-cover transition-opacity duration-300 {imageLoaded
			? 'opacity-0'
			: 'opacity-100'}"
		src="{site.prefix}/cdn-cgi/image/format=jpeg,{base}=24/{image.storage_key}"
		alt={image.alt ?? ''}
		{width}
		style="filter: blur(32px)"
	/>

	<picture class="transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-0'}">
		<source media="(max-width: 639px)" srcset={highResSrc} />
		<source media="(min-width: 640px)" srcset={highResSrcSet} />
		<img
			class="group-hover:scale-105 w-full h-full object-cover transition-all duration-300"
			src={highResSrc}
			srcset={highResSrcSet}
			sizes="(max-width: 720px) 100vw, 2x"
			alt={image.alt ?? ''}
			{width}
			loading="lazy"
			decoding="async"
			onload={() => (imageLoaded = true)}
			onerror={() => (imageLoaded = true)}
		/>
	</picture>
</div>

<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import InformationCircle from '$icons/InformationCircle.svelte';
	import type { ImageAttrs } from '$components/ContentContainer.svelte';

	let { attrs }: { attrs: ImageAttrs } = $props();

	const site = getSiteContext();

	let imageLoaded = $state(false);

	const highResSrc = $derived(
		`${site.prefix}/cdn-cgi/image/format=auto,width=740/${attrs.storage_key}`
	);
	const highResSrcSet = $derived(
		`${highResSrc} 1x, ${site.prefix}/cdn-cgi/image/format=auto,width=1280/${attrs.storage_key} 2x`
	);

	// 容器高度原本完全由高清图撑开，正文配图加载前后必然抖动。
	// CMS 存了原始宽高，用它算出比例先把位置占住。
	const aspectRatio = $derived(
		attrs.width && attrs.height ? `${attrs.width} / ${attrs.height}` : '3 / 2'
	);
</script>

<figure class="my-8">
	<div
		class="relative overflow-hidden rounded-md bg-zinc-100"
		id="image-{attrs.id}"
		style="aspect-ratio: {aspectRatio}"
	>
		<!-- 模糊占位图：纯装饰，alt 必须为空，否则读屏会把同一张图的描述念两遍 -->
		<img
			class="brightness-110 absolute inset-0 w-full h-full object-cover transition-opacity duration-300 {imageLoaded
				? 'opacity-0'
				: 'opacity-100'}"
			src="{site.prefix}/cdn-cgi/image/format=auto,width=24/{attrs.storage_key}"
			alt=""
			aria-hidden="true"
			width="740"
			style="filter: blur(36px)"
		/>

		<!-- High resolution image -->
		<picture
			class="block w-full h-full transition-opacity duration-300 {imageLoaded
				? 'opacity-100'
				: 'opacity-0'}"
		>
			<source media="(max-width: 639px)" srcset={highResSrc} />
			<source media="(min-width: 640px)" srcset={highResSrcSet} />
			<img
				class="w-full h-full object-cover"
				src={highResSrc}
				srcset={highResSrcSet}
				sizes="(max-width: 720px) 100vw, 740px"
				alt={attrs.alt ?? ''}
				width="740"
				loading="lazy"
				decoding="async"
				onload={() => (imageLoaded = true)}
			/>
		</picture>
	</div>
	{#if attrs.caption}
		<figcaption class="my-3 flex justify-start items-start gap-2 text-zinc-600">
			<InformationCircle class="mt-0.5 w-5 h-5 inline-block text-zinc-500" />
			{attrs.caption}
		</figcaption>
	{/if}
</figure>

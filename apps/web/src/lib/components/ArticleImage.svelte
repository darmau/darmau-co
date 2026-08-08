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
</script>

<figure class="my-8">
	<div class="relative overflow-hidden rounded-md" id="image-{attrs.id}">
		<!-- Low resolution blurred image -->
		<img
			class="brightness-110 absolute inset-0 w-full h-full object-cover transition-opacity duration-300 {imageLoaded
				? 'opacity-0'
				: 'opacity-100'}"
			src="{site.prefix}/cdn-cgi/image/format=auto,width=24/{attrs.storage_key}"
			alt={attrs.alt ?? ''}
			width="740"
			style="filter: blur(36px)"
		/>

		<!-- High resolution image -->
		<picture class="transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-0'}">
			<source media="(max-width: 639px)" srcset={highResSrc} />
			<source media="(min-width: 640px)" srcset={highResSrcSet} />
			<img
				class="group-hover:scale-105 w-full h-full object-cover transition-all duration-300"
				src={highResSrc}
				srcset={highResSrcSet}
				sizes="(max-width: 720px) 100vw, 2x"
				alt={attrs.alt ?? ''}
				width="740"
				onload={() => (imageLoaded = true)}
			/>
		</picture>
	</div>
	{#if attrs.caption}
		<figcaption class="my-3 flex justify-start items-start gap-2 text-zinc-600">
			<InformationCircle class="mt-0.5 w-5 h-5 inline-block text-zinc-400" />
			{attrs.caption}
		</figcaption>
	{/if}
</figure>

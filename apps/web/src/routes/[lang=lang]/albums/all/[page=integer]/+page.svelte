<script lang="ts">
	import { page as pageState } from '$app/state';
	import GalleryCard from '$components/GalleryCard.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import Pagination from '$components/Pagination.svelte';
	import Subnav from '$components/Subnav.svelte';
	import { getSiteContext } from '$lib/context';
	import HomepageText from '$locales/homepage';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import type { PageProps } from './$types';

	const PAGE_SIZE = 20;

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(HomepageText, site.lang));

	let visibleCount = $state(5);
	let sentinel = $state<HTMLDivElement | null>(null);

	// 将 pathname 末尾的 page 去掉
	const path = $derived(pageState.url.pathname.replace(/\/\d+$/, ''));

	const visibleItems = $derived(data.items.slice(0, Math.min(visibleCount, data.items.length)));
	const hasMore = $derived(visibleCount < data.items.length);

	$effect(() => {
		if (!sentinel || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					visibleCount = Math.min(data.items.length, visibleCount + 5);
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	const ogCover = $derived(
		data.items.find((item) => item.images.length > 0)?.images[0]?.storage_key ??
			'a2b148a3-5799-4be0-a8d4-907f9355f20f'
	);
</script>

<svelte:head>
	<title>{label.albums_title}</title>
	<meta name="description" content={label.albums_description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{site.lang}/album/rss.xml"
	/>
	<meta property="og:title" content={label.albums_title} />
	<meta property="og:url" content="{data.baseUrl}/{site.lang}/albums/all/{data.page}" />
	<meta
		property="og:image"
		content="{data.prefix}/cdn-cgi/image/format=jpeg,width=960/{ogCover}"
	/>
	<meta property="og:description" content={label.albums_description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="albums/all/{data.page}"
/>

<Subnav active="photography" />
<h1 class="sr-only">Photography</h1>
<div class="w-full max-w-5xl mx-auto p-4 lg:mb-16 space-y-6">
	<ul class="mx-auto space-y-12 lg:space-y-16 max-w-lg">
		{#each visibleItems as item (`${item.type}-${item.id}`)}
			<GalleryCard {item} lang={site.lang} prefix={site.prefix} />
		{/each}
	</ul>

	{#if hasMore}
		<div bind:this={sentinel} class="h-10" aria-hidden="true"></div>
	{/if}

	<Pagination count={data.count ?? 0} limit={PAGE_SIZE} page={data.page} {path} />
</div>

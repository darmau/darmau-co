<script lang="ts">
	import I18nHead from '$components/I18nHead.svelte';
	// 旧版用 React.lazy + Suspense 包了一层；MapGallery 自己已经把 mapbox-gl 放在
	// onMount/$effect 里动态 import，SSR 安全，所以这里直接静态引入即可。
	import MapGallery from '$components/MapGallery.svelte';
	import Subnav from '$components/Subnav.svelte';
	import { getSiteContext } from '$lib/context';
	import AlbumText from '$locales/album';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(AlbumText, site.lang));

	// 使用最新相册的封面图片，如果没有则使用默认图片
	const ogImage = $derived(
		data.latestPhotoStorageKey
			? `${data.imgPrefix}/cdn-cgi/image/format=jpeg,width=960/${data.latestPhotoStorageKey}`
			: `${data.imgPrefix}/cdn-cgi/image/format=jpeg,width=960/a2b148a3-5799-4be0-a8d4-907f9355f20f`
	);
</script>

<svelte:head>
	<title>{label.map_title}</title>
	<meta name="description" content={label.map_description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{site.lang}/album/rss.xml"
	/>
	<meta property="og:title" content={label.map_title} />
	<meta property="og:url" content="{data.baseUrl}/{site.lang}/albums/map" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={label.map_description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="albums/map"
/>

<Subnav active="photography" />
<div class="w-full max-w-8xl mx-auto p-4 md:py-8">
	<h1 class="sr-only">Albums Map</h1>
	<MapGallery
		mapboxToken={data.MAPBOX}
		imageCollection={data.imageCollection}
		imgPrefix={data.imgPrefix}
		lang={site.lang}
	/>
</div>

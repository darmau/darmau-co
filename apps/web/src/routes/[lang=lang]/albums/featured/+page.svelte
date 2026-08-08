<script lang="ts">
	import I18nHead from '$components/I18nHead.svelte';
	import MasonryAlbum from '$components/MasonryAlbum.svelte';
	import Subnav from '$components/Subnav.svelte';
	import { getSiteContext } from '$lib/context';
	import HomepageText from '$locales/homepage';
	import { generatePhotoAlbum } from '$utils/generatePhotoAlbum';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(HomepageText, site.lang));

	const photos = $derived(generatePhotoAlbum(data.featuredPhotos, site.prefix, site.lang));

	// 没有推荐摄影的时候会有bug（照抄旧 meta 里的注释）
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/${data.featuredPhotos[0]?.cover.storage_key ?? 'a2b148a3-5799-4be0-a8d4-907f9355f20f'}`
	);
</script>

<svelte:head>
	<title>{label.featured_albums_title}</title>
	<meta name="description" content={label.featured_albums_description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{site.lang}/album/rss.xml"
	/>
	<meta property="og:title" content={label.featured_albums_title} />
	<meta property="og:url" content="{data.baseUrl}/{site.lang}/albums/featured" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={label.featured_albums_description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="albums/featured"
/>

<Subnav active="photography" />
<!-- 原来硬编码英文「Featured Photography」，中日文用户的读屏会用本地语音引擎念英文 -->
<h1 class="sr-only">{label.featured_albums_title}</h1>
<div class="w-full max-w-8xl mx-auto p-4 md:py-8 lg:mb-16">
	<MasonryAlbum {photos} />
</div>

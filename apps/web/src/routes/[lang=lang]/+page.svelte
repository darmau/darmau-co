<script lang="ts">
	import HomeTopArticle from '$components/HomeTopArticle.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import NormalArticleCard from '$components/NormalArticleCard.svelte';
	import Subnav from '$components/Subnav.svelte';
	import UIText from '$lib/locales/ui';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lang = $derived(data.lang);
	const label = $derived(data.label);
	const uiLabel = $derived(getLanguageLabel(UIText, lang));
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/a2b148a3-5799-4be0-a8d4-907f9355f20f`
	);
</script>

<svelte:head>
	<title>{label.title}</title>
	<meta name="description" content={label.description} />
	<link rel="sitemap" type="application/xml" href="{data.baseUrl}/sitemap-index.xml" title="Sitemap" />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{lang}/rss.xml"
	/>
	<meta property="og:title" content={label.title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{data.baseUrl}/{lang}" />
	<meta property="og:image" content={ogImage} />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:title" content={label.title} />
	<meta property="twitter:description" content={label.description} />
	<meta property="og:description" content={label.description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="" />

{#if !data.articles || data.articles.length === 0}
	<Subnav active="article" />
	<header class="w-full max-w-6xl mx-auto p-4 md:py-8 mb-8 lg:mb-16">
		<h1 class="text-3xl font-black text-zinc-700 text-center my-16">{uiLabel.no_articles}</h1>
	</header>
{:else}
	<Subnav active="article" />
	<!-- 站名跟着语言走，原来写死了「积薪」，英文和日文用户的读屏会用本地语音引擎念中文 -->
	<h1 class="sr-only">{label.title}</h1>
	<div class="w-full max-w-8xl mx-auto px-4 space-y-8 lg:space-y-12 mb-8 lg:mb-16">
		<div
			class="flex flex-col gap-8 mt-4 border-b border-zinc-200 pb-8 lg:pb-12 lg:mt-8 lg:grid lg:grid-cols-2"
		>
			<HomeTopArticle isTop={true} article={data.articles[0]} classList="group" />
			<div class="flex flex-col gap-8 md:grid md:grid-cols-3 lg:flex lg:flex-col">
				{#each data.articles.slice(1, 4) as article (article.id)}
					<HomeTopArticle isTop={false} {article} classList="group" />
				{/each}
			</div>
		</div>
		<div class="space-y-8">
			<h2 class="font-medium text-lg text-zinc-700">{label.recent_article}</h2>
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
				{#each data.articles.slice(4) as article (article.id)}
					<NormalArticleCard {article} showAbstract={false} />
				{/each}
			</div>
		</div>
	</div>
{/if}

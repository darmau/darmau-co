<script lang="ts">
	import { page as currentPage } from '$app/state';
	import FeaturedArticle from '$components/FeaturedArticle.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import Pagination from '$components/Pagination.svelte';
	import Subnav from '$components/Subnav.svelte';
	import { getSiteContext } from '$lib/context';
	import HomepageText from '$lib/locales/homepage';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const lang = $derived(site.lang);
	const label = $derived(getLanguageLabel(HomepageText, lang));
	// 将pathname末尾的page去掉
	const path = $derived(currentPage.url.pathname.replace(/\/\d+$/, ''));
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/${data.articles[0]?.cover?.storage_key ?? 'a2b148a3-5799-4be0-a8d4-907f9355f20f'}`
	);
</script>

<svelte:head>
	<title>{label.featured_article_title}</title>
	<!-- 原 meta() 在没有文章时只输出 title，这里保持一致 -->
	{#if data.articles.length > 0}
		<meta name="description" content={label.featured_article_description} />
		<link
			rel="alternate"
			type="application/rss+xml"
			title="RSS"
			href="{data.baseUrl}/{lang}/article/rss.xml"
		/>
		<meta property="og:title" content={label.featured_article_title} />
		<meta property="og:type" content="article" />
		<meta property="og:url" content="{data.baseUrl}/{lang}/articles/featured/{data.page}" />
		<meta property="og:image" content={ogImage} />
		<meta property="og:description" content={label.featured_article_description} />
		<meta property="twitter:card" content="summary_large_image" />
		<meta property="twitter:creator" content="@darmau8964" />
	{/if}
</svelte:head>

{#if data.articles.length > 0}
	<!-- 原 i18nLinks 的 path 不带页码，照抄 -->
	<I18nHead
		baseUrl={data.baseUrl}
		{lang}
		availableLangs={data.availableLangs}
		path="articles/featured"
	/>
{/if}

{#if data.articles.length === 0}
	<div>No articles found</div>
{:else}
	<Subnav active="article" />
	<h1 class="sr-only">Featured Articles</h1>
	<div class="w-full max-w-8xl mx-auto p-4 md:py-8 mb-8 lg:mb-16 space-y-8 lg:space-y-12">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each data.articles as article (article.id)}
				<FeaturedArticle {article} />
			{/each}
		</div>
		<Pagination count={data.articleCount} limit={12} page={data.page} {path} />
	</div>
{/if}

<script lang="ts">
	import { page as currentPage } from '$app/state';
	import I18nHead from '$components/I18nHead.svelte';
	import NormalArticleCard from '$components/NormalArticleCard.svelte';
	import PageContainer from '$components/PageContainer.svelte';
	import Pagination from '$components/Pagination.svelte';
	import Subnav from '$components/Subnav.svelte';
	import { getSiteContext } from '$lib/context';
	import ArticlesText from '$lib/locales/articles';
	import HomepageText from '$lib/locales/homepage';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const lang = $derived(site.lang);
	const label = $derived(getLanguageLabel(ArticlesText, lang));
	const homeLabel = $derived(getLanguageLabel(HomepageText, lang));
	// 将pathname末尾的page去掉
	const path = $derived(currentPage.url.pathname.replace(/\/\d+$/, ''));
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/a2b148a3-5799-4be0-a8d4-907f9355f20f`
	);
</script>

<svelte:head>
	<title>{homeLabel.recent_article}</title>
	<meta name="description" content={homeLabel.recent_article_description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{lang}/article/rss.xml"
	/>
	<meta property="og:title" content={homeLabel.recent_article} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{data.baseUrl}/{lang}/articles/{data.page}" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={homeLabel.recent_article_description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	{lang}
	availableLangs={data.availableLangs}
	path="articles/{data.page}"
/>

{#if data.articles.length === 0}
	<Subnav active="article" />
	<header class="w-full max-w-6xl mx-auto p-4 md:py-8 mb-8 lg:mb-16">
		<h1 class="text-3xl font-black text-zinc-700 text-center my-16">{label.no_articles}</h1>
	</header>
{:else}
	<Subnav active="article" />
	<!-- 原来硬编码英文「Articles」，中日文用户的读屏会用本地语音引擎念英文 -->
	<h1 class="sr-only">{homeLabel.recent_article}</h1>
	<PageContainer class="flex flex-col gap-8 md:grid md:grid-cols-3">
		<div class="grow flex flex-col gap-8 py-8 md:py-0 md:gap-12 md:col-span-2">
			{#each data.articles as article (article.id)}
				<NormalArticleCard {article} showAbstract={true} />
			{/each}
			<Pagination count={data.articleCount} limit={12} page={data.page} {path} />
		</div>
		<aside class="pb-4 space-y-8 md:col-span-1">
			<div class="space-y-4">
				<!-- 侧栏标题原来是 h3，页面 h1 之后直接跳到 h3 -->
				<h2 class="text-sm font-semibold text-violet-600">{label.year}</h2>
				<ol class="">
					{#if data.countByYear && data.countByYear.length > 0}
						{#each data.countByYear as year (year.year)}
							<li class="p-2 rounded-md hover:bg-zinc-50 cursor-pointer">
								<a href="/{lang}/articles/archive/{year.year}/1" class="text-base text-zinc-500 block">
									{year.year} ({year.count})
								</a>
							</li>
						{/each}
					{:else}
						<li class="text-sm text-zinc-500 p-2">{label.no_data}</li>
					{/if}
				</ol>
			</div>
			<div class="space-y-4">
				<h2 class="text-sm font-semibold text-violet-600">{label.category}</h2>
				<ol class="">
					{#each data.countByCategory as category (category.slug)}
						{#if category.count !== 0}
							<li class="p-2 rounded-md hover:bg-zinc-50 cursor-pointer">
								<a
									href="/{lang}/articles/category/{category.slug}/1"
									class="text-base text-zinc-500 block"
								>
									{category.title} ({category.count})
								</a>
							</li>
						{/if}
					{/each}
				</ol>
			</div>
		</aside>
	</PageContainer>
{/if}

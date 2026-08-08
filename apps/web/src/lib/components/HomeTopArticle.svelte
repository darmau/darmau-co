<script lang="ts">
	import type { Article } from '$lib/types/Article';
	import { getSiteContext } from '$lib/context';
	import getTime from '$utils/getTime';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import ChatBubbleOvalLeft from '$icons/ChatBubbleOvalLeft.svelte';
	import Eye from '$icons/Eye.svelte';
	import LockClosed from '$icons/LockClosed.svelte';

	let {
		article,
		isTop,
		classList
	}: { article: Article; isTop: boolean; classList?: string } = $props();

	const site = getSiteContext();
</script>

<article class={classList}>
	<a
		href="/{site.lang}/article/{article.slug}"
		class="gap-4 flex flex-col lg:gap-6 {isTop ? 'lg:flex-col' : 'lg:flex-row'}"
	>
		{#if article.cover}
			{#if isTop}
				<ResponsiveImage
					image={article.cover}
					width={640}
					classList="aspect-5/3 sm:aspect-3/1 w-full rounded-md overflow-hidden"
				/>
			{:else}
				<ResponsiveImage
					image={article.cover}
					width={640}
					classList="aspect-5/3 sm:aspect-3/1 w-full rounded-md overflow-hidden md:aspect-3/2 lg:grow-0 lg:max-w-48"
				/>
			{/if}
		{/if}
		<div class="flex flex-col gap-3 sm:grow">
			<div class="text-zinc-400 text-sm">
				<span class="text-violet-700 font-medium">{article.category.title}</span>&nbsp;·&nbsp;<span
					>{getTime(article.published_at, site.lang)}</span
				>
			</div>
			<div class="flex items-center gap-2 text-zinc-800 group-hover:text-violet-900">
				{#if article.is_premium}
					<LockClosed class="h-5 w-5 text-violet-600 {isTop ? '' : 'mt-0.5'}" />
				{/if}
				<h2 class="font-medium {isTop ? 'text-3xl' : 'text-2xl'}">{article.title}</h2>
			</div>
			<h3 class="text-base text-zinc-500 leading-7">{article.subtitle}</h3>
			{#if article.topic}
				<div class="flex flex-wrap gap-2">
					{#each article.topic as topic, index (index)}
						<span
							class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
						>
							{topic}
						</span>
					{/each}
				</div>
			{/if}
			{#if isTop && article.abstract}
				<p class="text-sm bg-zinc-50 p-2 rounded-md text-zinc-500 mt-2 lg:p-4">{article.abstract}</p>
			{/if}
			<div class="flex gap-3 justify-start items-center">
				<div class="flex gap-1 items-center">
					<Eye class="h-4 w-4 inline-block text-zinc-400" />
					<span class="text-zinc-500 text-sm">{article.page_view}</span>
				</div>
				<div class="flex gap-1 items-center">
					<ChatBubbleOvalLeft class="h-4 w-4 inline-block text-zinc-400" />
					<span class="text-zinc-500 text-sm">{article.comments[0].count}</span>
				</div>
			</div>
		</div>
	</a>
</article>

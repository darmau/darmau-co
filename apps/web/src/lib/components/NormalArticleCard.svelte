<script lang="ts">
	import type { Article } from '$lib/types/Article';
	import { getSiteContext } from '$lib/context';
	import getTime from '$utils/getTime';
	import ChatBubbleOvalLeft from '$icons/ChatBubbleOvalLeft.svelte';
	import Eye from '$icons/Eye.svelte';
	import LockClosed from '$icons/LockClosed.svelte';

	let { article, showAbstract = false }: { article: Article; showAbstract?: boolean } = $props();

	const site = getSiteContext();
</script>

<article title={article.abstract ?? ''} class="group">
	<a href="/{site.lang}/article/{article.slug}" class="flex flex-col gap-2">
		<div class="text-zinc-400 text-sm">
			<span class="text-violet-700 font-medium">{article.category.title}</span>&nbsp;·&nbsp;<span
				>{getTime(article.published_at, site.lang)}</span
			>
		</div>
		<div class="flex items-center gap-2 text-zinc-800 group-hover:text-violet-900">
			{#if article.is_premium}
				<LockClosed class="h-5 w-5 text-violet-600 mt-0.5" />
			{/if}
			<h3 class="text-2xl font-medium">{article.title}</h3>
		</div>
		<h4 class="text-base text-zinc-500 leading-7">{article.subtitle}</h4>
		{#if article.topic}
			<div class="flex flex-wrap gap-2 pt-2">
				{#each article.topic as topic, index (index)}
					<span
						class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
					>
						{topic}
					</span>
				{/each}
			</div>
		{/if}
		{#if showAbstract && article.abstract}
			<div class="bg-zinc-100 p-2 text-sm text-zinc-700 mt-3 rounded-md md:p-4 leading-6">
				{article.abstract}
			</div>
		{/if}
		<div class="flex gap-3 justify-start items-center mt-2">
			<div class="flex gap-1 items-center">
				<Eye class="h-4 w-4 inline-block text-zinc-400" />
				<span class="text-zinc-500 text-sm">{article.page_view}</span>
			</div>
			<div class="flex gap-1 items-center">
				<ChatBubbleOvalLeft class="h-4 w-4 inline-block text-zinc-400" />
				<span class="text-zinc-500 text-sm">{article.comments[0].count}</span>
			</div>
		</div>
	</a>
</article>

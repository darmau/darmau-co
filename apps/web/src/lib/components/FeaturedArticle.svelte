<script lang="ts">
	import type { Article } from '$lib/types/Article';
	import { getSiteContext } from '$lib/context';
	import getTime from '$utils/getTime';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import ChatBubbleOvalLeft from '$icons/ChatBubbleOvalLeft.svelte';
	import Eye from '$icons/Eye.svelte';

	let { article }: { article: Article } = $props();

	const site = getSiteContext();
</script>

<article class="group">
	<a href="/{site.lang}/article/{article.slug}">
		{#if article.cover}
			<ResponsiveImage
				image={article.cover}
				width={480}
				classList="aspect-5/3 sm:aspect-3/1 md:aspect-3/2 w-full rounded-md overflow-hidden mb-4"
			/>
		{/if}
		<div class="flex flex-col gap-3">
			<div class="text-zinc-400 text-sm">
				<span class="text-violet-700 font-medium">{article.category.title}</span>&nbsp;·&nbsp;<span
					>{getTime(article.published_at, site.lang)}</span
				>
			</div>
			<h3 class="font-medium text-zinc-800 group-hover:text-violet-900 text-xl lg:text-2xl">
				{article.title}
			</h3>
			<h4 class="text-base text-zinc-500 leading-7">{article.subtitle}</h4>
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

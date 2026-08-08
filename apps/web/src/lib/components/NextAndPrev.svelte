<script lang="ts" module>
	export interface NeighboringPost {
		title: string;
		slug: string;
	}
</script>

<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import ArticleText from '$locales/article';

	let {
		type,
		next,
		prev
	}: { type: string; next: NeighboringPost | null; prev: NeighboringPost | null } = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(ArticleText, site.lang));
</script>

<!-- 上一篇/下一篇是导航，不是文章结构的一部分，原来的 h3/h4 纯粹是拿标题标签当字号用 -->
<nav
	class="flex justify-between items-center flex-wrap border-y border-zinc-200 py-8 mt-12"
	aria-label="{label.previous} / {label.next}"
>
	{#if prev}
		<div class="flex flex-col gap-2">
			<p class="font-medium text-violet-900 text-sm">{label.previous}</p>
			<a
				href="/{site.lang}/{type}/{prev.slug}"
				class="font-medium text-zinc-800 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{prev.title}
			</a>
		</div>
	{/if}
	{#if next}
		<div class="flex flex-col gap-2 items-end text-right ml-auto">
			<p class="font-medium text-violet-900 text-sm">{label.next}</p>
			<a
				href="/{site.lang}/{type}/{next.slug}"
				class="font-medium text-zinc-800 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{next.title}
			</a>
		</div>
	{/if}
</nav>

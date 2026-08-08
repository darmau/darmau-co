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

<div class="flex justify-between items-center flex-wrap border-y border-gray-200 py-8 mt-12">
	{#if prev}
		<div class="flex flex-col gap-2">
			<h3 class="font-medium text-violet-900 text-sm">{label.previous}</h3>
			<a href="/{site.lang}/{type}/{prev.slug}">
				<h4 class="font-medium text-zinc-800 text-lg">
					{prev.title}
				</h4>
			</a>
		</div>
	{/if}
	{#if next}
		<div class="flex flex-col gap-2 items-end text-right ml-auto">
			<h3 class="font-medium text-violet-900 text-sm">{label.next}</h3>
			<a href="/{site.lang}/{type}/{next.slug}">
				<h4 class="font-medium text-zinc-800 text-lg">
					{next.title}
				</h4>
			</a>
		</div>
	{/if}
</div>

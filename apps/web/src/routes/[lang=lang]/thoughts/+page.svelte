<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import I18nHead from '$components/I18nHead.svelte';
	import Subnav from '$components/Subnav.svelte';
	import ThoughtCard, { type Thought } from '$components/ThoughtCard.svelte';
	import { untrack } from 'svelte';
	import { getSiteContext } from '$lib/context';
	import ThoughtText from '$locales/thought';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import { trackLoadMore } from '$utils/zaraz';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(ThoughtText, site.lang));

	// 对应原来的 useState(loaderData.thoughts)：只取首次快照，后续靠「加载更多」追加
	let thoughts = $state<Thought[]>(untrack(() => data.thoughts));
	let page = $state(1);
	let submitting = $state(false);

	const isLoadMoreThoughts = (value: unknown): value is { thoughts: Thought[] } =>
		typeof value === 'object' &&
		value !== null &&
		Array.isArray((value as { thoughts?: unknown }).thoughts);

	// 原来是 useFetcher.submit({page})，这里换成 ?/loadmore 的 enhance 提交，
	// 结果手动 append 到列表，不触发导航、不重跑 load
	const loadMore: SubmitFunction = () => {
		trackLoadMore('thought');
		submitting = true;
		page = page + 1;

		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success' && isLoadMoreThoughts(result.data)) {
				thoughts = [...thoughts, ...result.data.thoughts];
			}
		};
	};
</script>

<svelte:head>
	<title>{label.all_thoughts}</title>
	<meta name="description" content={label.description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{site.lang}/thought/rss.xml"
	/>
	<meta property="og:title" content={label.all_thoughts} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{data.baseUrl}/{site.lang}/thoughts" />
	<meta property="og:description" content={label.description} />
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="thoughts"
/>

<Subnav active="others" />
<h1 class="sr-only">Thought Detail</h1>
<div class="w-full flex-1 min-h-full max-w-2xl mx-auto p-4 md:py-8 lg:mb-16">
	<div class="flex flex-col gap-4">
		{#each thoughts as thought (thought.id)}
			<ThoughtCard {thought} />
		{/each}
	</div>
	<form method="POST" action="?/loadmore" use:enhance={loadMore}>
		<input type="hidden" name="page" value={page} />
		<button
			type="submit"
			class="bg-violet-700 font-medium px-4 py-2 text-white rounded-md mt-4 mx-auto block text-sm"
			disabled={submitting}
		>
			{submitting ? label.loading : label.loadmore}
		</button>
	</form>
</div>

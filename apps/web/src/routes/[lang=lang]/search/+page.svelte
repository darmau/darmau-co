<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import I18nHead from '$components/I18nHead.svelte';
	import MarkdownContent from '$components/MarkdownContent.svelte';
	import SearchResult from '$components/SearchResult.svelte';
	import { getSiteContext } from '$lib/context';
	import SearchText from '$locales/search';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(SearchText, site.lang));

	// 旧版读的是 useNavigation().state（`<Form>` 会触发一次导航）；SvelteKit 的
	// form action 走 use:enhance 的 fetch，没有对应的全局状态，改成本地标记
	let isLoading = $state(false);

	const submit: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			await update({ reset: false });
			isLoading = false;
		};
	};
</script>

<svelte:head>
	<title>{label.title}</title>
	<meta name="description" content={label.description} />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="search"
/>

<div class="max-w-2xl mx-auto my-8 lg:my-12 px-4 lg:p-0">
	<header class="text-center space-y-4 mb-8">
		<h1 class="font-medium text-3xl text-zinc-700">{label.title}</h1>
		<p class="text-zinc-500">{label.description}</p>
	</header>

	<form method="POST" action="?/search" class="space-y-6" use:enhance={submit}>
		<div class="mb-4">
			<label for="query" class="block text-sm font-medium leading-6 text-gray-900 mb-2">
				{label.search_placeholder}
			</label>
			<input
				id="query"
				name="query"
				type="text"
				class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 sm:text-sm sm:leading-6"
				placeholder={label.search_placeholder}
				required
				disabled={isLoading}
			/>
		</div>
		<button
			type="submit"
			disabled={isLoading}
			class="flex w-full justify-center rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{isLoading ? label.loading : label.search_button}
		</button>
	</form>

	{#if form?.error}
		<div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
			<p class="text-red-800 text-sm">{label.error}: {form.error}</p>
		</div>
	{/if}

	{#if form?.results}
		<div class="mt-8 space-y-6">
			{#if form.results.response}
				<div class="bg-gray-50 rounded-lg p-6">
					<h3 class="font-semibold text-lg text-gray-900 mb-3">
						{label.answer_heading}
					</h3>
					<div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
						<MarkdownContent content={form.results.response} />
					</div>
				</div>
			{/if}

			{#if form.results.data && form.results.data.length > 0}
				<div>
					<h3 class="font-semibold text-lg text-gray-900 mb-4">
						{label.results_heading}
					</h3>
					<div class="space-y-4">
						{#each form.results.data as result (result.file_id)}
							<SearchResult {result} />
						{/each}
					</div>
				</div>
			{/if}

			{#if form.results.data && form.results.data.length === 0}
				<div class="text-center py-8 text-gray-500">
					{label.no_results}
				</div>
			{/if}
		</div>
	{/if}
</div>

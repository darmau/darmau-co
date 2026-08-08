<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import I18nHead from '$components/I18nHead.svelte';
	import RateStars from '$components/RateStars.svelte';
	import Subnav from '$components/Subnav.svelte';
	import LinkIcon from '$icons/Link.svelte';
	import { untrack } from 'svelte';
	import { getSiteContext } from '$lib/context';
	import BookText from '$locales/books';
	import ThoughtText from '$locales/thought';
	import UIText from '$locales/ui';
	import getDate from '$utils/getDate';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import { trackLoadMore } from '$utils/zaraz';
	import type { BookRecord } from './+page.server';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const bookLabel = $derived(getLanguageLabel(BookText, site.lang));
	// 没有专属文案，套用thought里的
	const label = $derived(getLanguageLabel(ThoughtText, site.lang));
	const uiLabel = $derived(getLanguageLabel(UIText, site.lang));

	// 对应原来的 useState(loaderData.books)：只取首次快照，后续靠「加载更多」追加
	let books = $state<BookRecord[]>(untrack(() => data.books));
	let page = $state(1);
	let submitting = $state(false);

	const isLoadMoreResponse = (value: unknown): value is { books: BookRecord[] } =>
		typeof value === 'object' &&
		value !== null &&
		Array.isArray((value as { books?: unknown }).books);

	const loadMore: SubmitFunction = () => {
		trackLoadMore('book');
		submitting = true;
		page = page + 1;

		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success' && isLoadMoreResponse(result.data)) {
				books = [...books, ...result.data.books];
			}
		};
	};
</script>

<svelte:head>
	<title>{bookLabel.title}({data.count ?? 0})</title>
	<meta name="description" content={bookLabel.description} />
	<meta property="og:title" content={bookLabel.title} />
	<meta property="og:url" content="{data.baseUrl}/{site.lang}/book" />
	<meta property="og:description" content={bookLabel.description} />
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<I18nHead baseUrl={data.baseUrl} lang={site.lang} availableLangs={data.availableLangs} path="book" />

<Subnav active="others" />
<!-- 原来硬编码英文「Books」，中日文用户的读屏会用本地语音引擎念英文 -->
<h1 class="sr-only">{bookLabel.title}</h1>
<div class="w-full max-w-6xl mx-auto p-4 md:py-8 my-8 lg:my-12">
	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		{#each books as book (book.id)}
			<div class="flex gap-4 justify-between items-start lg:my-4">
				{#if book.cover}
					<img
						src="{data.prefix}/cdn-cgi/image/format=auto,width=120/{book.cover.storage_key}"
						alt={book.cover.alt ?? ''}
						class="h-32 aspect-3/4 object-cover shadow-lg"
					/>
				{/if}
				<div class="w-full space-y-2 lg:space-y-3">
					<!-- 页面 h1 是 sr-only 的书单标题，这里原来是 h3，中间缺了 h2 -->
					<h2 class="font-medium text-lg text-zinc-800">{book.title}</h2>
					<RateStars n={book.rate} />
					{#if book.comment}
						<p class="text-zinc-700">{book.comment}</p>
					{/if}
					<div class="text-sm text-zinc-500">{getDate(book.date!, site.lang)}</div>
					{#if book.link}
						<!-- 原来链接里只有一个 aria-hidden 的图标，可访问名为空，读屏只报「链接」 -->
						<a
							href={book.link}
							target="_blank"
							class="block my-2 w-fit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
							rel="noopener noreferrer"
						>
							<LinkIcon class="w-4 h-4 text-zinc-500 hover:text-violet-700 cursor-pointer" />
							<span class="sr-only">
								{bookLabel.view_detail}{book.title}{uiLabel.opens_in_new_window}
							</span>
						</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	<form method="POST" action="?/loadmore" use:enhance={loadMore}>
		<input type="hidden" name="page" value={page} />
		<button
			type="submit"
			class="bg-violet-700 font-medium px-4 py-2 text-white rounded-md my-8 mx-auto block text-sm"
			disabled={submitting}
		>
			{submitting ? label.loading : label.loadmore}
		</button>
	</form>
</div>

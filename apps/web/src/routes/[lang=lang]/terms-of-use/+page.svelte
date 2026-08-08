<script lang="ts">
	import I18nHead from '$components/I18nHead.svelte';
	import HomepageText from '$lib/locales/homepage';
	import LegalText from '$lib/locales/legal';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lang = $derived(data.lang);
	const legalCopy = $derived(LegalText(lang));
	const pageTitle = $derived(`${legalCopy.title} | ${getLanguageLabel(HomepageText, lang).title}`);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={legalCopy.description} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={legalCopy.description} />
	<meta property="og:type" content="article" />
	{#if data.baseUrl}
		<meta property="og:url" content="{data.baseUrl}/{lang}/terms-of-use" />
	{/if}
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={legalCopy.description} />
</svelte:head>

<I18nHead
	baseUrl={data.baseUrl}
	{lang}
	availableLangs={data.availableLangs}
	path="terms-of-use"
/>

<section class="mx-auto max-w-3xl px-4 py-12 lg:py-16">
	<header class="space-y-2">
		<h1 class="text-3xl font-bold text-zinc-800 sm:text-4xl">{legalCopy.title}</h1>
		<p class="text-sm text-zinc-500">{legalCopy.description}</p>
	</header>
	<article
		class="mt-10 space-y-6 text-base leading-8 text-zinc-700 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-zinc-800 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-zinc-700 [&_strong]:font-semibold [&_a]:text-violet-700 [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-violet-600 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-600 [&_hr]:my-10"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- 内容来自仓库内的 legal/*.md，不是用户输入 -->
		{@html data.html}
	</article>
</section>

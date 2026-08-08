<script lang="ts">
	import i18nLinks from '$lib/utils/i18nLinks';

	// 原 React 版本由 meta() 把 i18nLinks 的结果并进 meta 描述符数组；
	// SvelteKit 没有 meta 导出，改成一个只往 <svelte:head> 里塞标签的组件。
	let {
		baseUrl,
		lang,
		availableLangs,
		path
	}: {
		baseUrl: string;
		lang: string;
		availableLangs: string[];
		/** 不含语言前缀的路径，例如 "about"、"article/foo"；首页传 "" */
		path: string;
	} = $props();

	const links = $derived(i18nLinks(baseUrl, lang, availableLangs, path));
</script>

<svelte:head>
	{#each links as tag (('href' in tag ? tag.href : tag.content) + ('rel' in tag ? tag.rel : ''))}
		{#if 'tagName' in tag}
			<link rel={tag.rel} href={tag.href} hreflang={tag.hrefLang} />
		{:else}
			<meta property={tag.property} content={tag.content} />
		{/if}
	{/each}
</svelte:head>

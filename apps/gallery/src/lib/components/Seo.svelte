<script lang="ts">
	import { page } from '$app/state';
	import { BCP47, LANGS, localize, stripLang, type Lang } from '$lib/i18n';

	interface Props {
		title: string;
		description: string;
		image?: string;
		type?: 'website' | 'article';
		/** 不带语言前缀的路径；默认取当前 URL。查看器浅路由翻页后 page.url 不会变，需要显式传 */
		path?: string;
	}

	let { title, description, image, type = 'website', path: pathProp }: Props = $props();

	const lang = $derived(page.data.lang as Lang);
	const base = $derived(page.data.baseUrl as string);
	const path = $derived(pathProp ?? stripLang(page.url.pathname));
	const canonical = $derived(`${base}${localize(lang, path)}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#each LANGS as code (code)}
		<link rel="alternate" hreflang={BCP47[code]} href={`${base}${localize(code, path)}`} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={`${base}${path}`} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content="DARMAU Photography" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={BCP47[lang].replace('-', '_')} />
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	<meta name="twitter:site" content="@darmau8964" />
</svelte:head>

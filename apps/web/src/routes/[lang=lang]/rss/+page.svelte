<script lang="ts">
	import Subnav from '$components/Subnav.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import { getSiteContext } from '$lib/context';
	import RSSText from '$lib/locales/rss';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import { trackRSSClick, type RSSType } from '$lib/utils/zaraz';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const site = getSiteContext();
	const lang = $derived(site.lang);
	const prefix = $derived(site.prefix);
	const label = $derived(getLanguageLabel(RSSText, lang));

	let copiedArticle = $state(false);
	let copiedPhoto = $state(false);
	let copiedThought = $state(false);

	const copyToClipboard = async (url: string, type: RSSType) => {
		try {
			await navigator.clipboard.writeText(url);
			trackRSSClick(type);
			if (type === 'article') {
				copiedPhoto = false;
				copiedThought = false;
				copiedArticle = true;
			} else if (type === 'photo') {
				copiedArticle = false;
				copiedThought = false;
				copiedPhoto = true;
			} else {
				copiedArticle = false;
				copiedPhoto = false;
				copiedThought = true;
			}
		} catch (err) {
			console.error('复制失败:', err);
		}
	};
</script>

<svelte:head>
	<title>{label.page_title}</title>
	<meta name="description" content={label.page_description} />
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="rss" />

<Subnav active="about" />
<div class="w-full max-w-8xl mx-auto p-4 md:py-8 my-8">
	<header class="text-center space-y-2 mb-12">
		<h2 class="font-medium text-sm text-violet-700">RSS</h2>
		<h1 class="font-medium text-zinc-900 text-3xl lg:text-4xl">{label.title}</h1>
		<p class="text-base text-zinc-600">{label.description}</p>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<section class="rounded-2xl border border-gray-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-gray-200 space-y-4">
				<h3 class="font-medium text-lg text-zinc-700">{label.article}</h3>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/article/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/article/rss.xml`, 'article')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md"
				>
					{copiedArticle ? label.copied : label.copy}
				</button>
			</div>
			{#if data.articles}
				<ol class="space-y-4 p-4 lg:p-8">
					{#each data.articles as article (article.id)}
						<li>
							<h4 class="font-medium text-zinc-700">{article.title}</h4>
							<p class="text-zinc-500 mt-1">{article.subtitle}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
		<section class="rounded-2xl border border-gray-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-gray-200 space-y-4">
				<h3 class="font-medium text-lg text-zinc-700">{label.photography}</h3>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/album/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/album/rss.xml`, 'photo')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md"
				>
					{copiedPhoto ? label.copied : label.copy}
				</button>
			</div>
			<div class="grid grid-cols-3 gap-2 mt-8 p-4 lg:p-8">
				{#if data.photos}
					{#each data.photos as photo (photo.id)}
						{#if photo.cover}
							<div class="aspect-square overflow-hidden rounded">
								<img
									src="{prefix}/cdn-cgi/image/format=auto,width=240/{photo.cover.storage_key}"
									alt={photo.title ?? ''}
									class="w-full h-full object-cover"
								/>
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</section>
		<section class="rounded-2xl border border-gray-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-gray-200 space-y-4">
				<h3 class="font-medium text-lg text-zinc-700">{label.thought}</h3>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/thought/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/thought/rss.xml`, 'thought')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md"
				>
					{copiedThought ? label.copied : label.copy}
				</button>
			</div>
			{#if data.thoughts}
				<ol class="space-y-4 p-4 lg:p-8 pl-8 lg:pl-12 list-decimal">
					{#each data.thoughts as thought (thought.id)}
						<li>
							<p class="text-zinc-700">{thought.content_text}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	</div>
</div>

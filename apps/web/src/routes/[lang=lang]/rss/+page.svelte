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
	<!-- 这页专门介绍订阅方式，却是全站唯一没有声明 feed 的页面，浏览器/阅读器发现不了 -->
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{lang}/rss.xml"
	/>
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="rss" />

<Subnav active="about" />
<div class="w-full max-w-8xl mx-auto p-4 md:py-8 my-8">
	<header class="text-center space-y-2 mb-12">
		<!-- 装饰性的 eyebrow，原来用 h2 会排在 h1 前面 -->
		<p class="font-medium text-sm text-violet-700">RSS</p>
		<h1 class="font-medium text-zinc-900 text-3xl lg:text-4xl">{label.title}</h1>
		<p class="text-base text-zinc-600">{label.description}</p>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<section class="rounded-2xl border border-zinc-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-zinc-200 space-y-4">
				<!-- 三个分区标题原来是 h3，紧跟在 h1 后面属于跳级 -->
				<h2 class="font-medium text-lg text-zinc-700">{label.article}</h2>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/article/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/article/rss.xml`, 'article')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					{copiedArticle ? label.copied : label.copy}
				</button>
			</div>
			{#if data.articles}
				<ol class="space-y-4 p-4 lg:p-8">
					{#each data.articles as article (article.id)}
						<li>
							<h3 class="font-medium text-zinc-700">{article.title}</h3>
							<p class="text-zinc-500 mt-1">{article.subtitle}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
		<section class="rounded-2xl border border-zinc-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-zinc-200 space-y-4">
				<h2 class="font-medium text-lg text-zinc-700">{label.photography}</h2>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/album/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/album/rss.xml`, 'photo')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
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
		<section class="rounded-2xl border border-zinc-200 shadow-lg">
			<div class="p-4 lg:p-8 border-b border-zinc-200 space-y-4">
				<h2 class="font-medium text-lg text-zinc-700">{label.thought}</h2>
				<code class="text-sm block font-mono text-zinc-600"
					>{`https://darmau.co/${lang}/thought/rss.xml`}</code
				>
				<button
					onclick={() => copyToClipboard(`https://darmau.co/${lang}/thought/rss.xml`, 'thought')}
					class="bg-violet-600 text-white font-medium py-3 w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
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

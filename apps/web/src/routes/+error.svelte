<script lang="ts">
	import { page } from '$app/state';
	import UIText from '$lib/locales/ui';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	const LANGS = ['zh', 'en', 'jp'];

	// error 页没有 layout data 可用（load 失败时也要能渲染），从路径首段自己推语言
	const lang = $derived.by(() => {
		const segment = page.url.pathname.split('/')[1] ?? '';
		return LANGS.includes(segment) ? segment : 'zh';
	});

	const label = $derived(getLanguageLabel(UIText, lang));
	const notFound = $derived(page.status === 404);

	// 不直接展示 page.error.message：那是给开发者看的英文内部消息
	// （"Article not exists"、"Unauthorized" 之类），对访客没有意义
	const title = $derived(notFound ? label.error_404_title : label.error_generic_title);
	const description = $derived(
		notFound ? label.error_404_description : label.error_generic_description
	);
</script>

<svelte:head>
	<title>{page.status} · {title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="grid min-h-[60vh] place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
	<div class="text-center">
		<p class="text-base font-semibold text-violet-600">{page.status}</p>
		<h1 class="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
			{title}
		</h1>
		<p class="mt-6 text-base text-zinc-600">{description}</p>
		<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
			<a
				href="/{lang}"
				class="rounded-md bg-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{label.back_home}
			</a>
			{#if notFound}
				<a
					href="/{lang}/search"
					class="rounded-md px-3.5 py-2.5 text-sm font-semibold text-zinc-900 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					{label.go_search} <span aria-hidden="true">→</span>
				</a>
			{/if}
		</div>
	</div>
</div>

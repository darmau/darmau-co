<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { clickOutside } from '$lib/actions/clickOutside';
	import TranslateIcon from '$icons/Translate.svelte';
	import { getLanguageSwitcherLinks } from '$lib/utils/getLanguageSwitcherLinks';
	import UIText from '$lib/locales/ui';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	let { lang, panelClass = 'z-50' }: { lang: string; panelClass?: string } = $props();

	const label = $derived(getLanguageLabel(UIText, lang));

	const LANG_LABELS = new Map([
		['zh', '中文'],
		['en', 'English'],
		['jp', '日本語']
	]);

	// 路径段 jp 对应的 BCP-47 是 ja，读屏靠这个选对语音引擎念「日本語」
	const BCP47 = new Map([
		['zh', 'zh-Hans'],
		['en', 'en'],
		['jp', 'ja']
	]);

	let open = $state(false);

	// 详情页的 load 会返回 availableLangs，用来判断该语言是否有对应内容
	const availableLangs = $derived(page.data.availableLangs as string[] | undefined);

	// 去掉语言前缀后的路径：/zh/article/foo -> article/foo
	const currentPath = $derived.by(() => {
		const parts = page.url.pathname.split('/').filter(Boolean);
		return parts.length > 1 ? parts.slice(1).join('/') : '';
	});

	const links = $derived(getLanguageSwitcherLinks(lang, currentPath, availableLangs));

	const options = $derived(
		[...LANG_LABELS]
			.filter(([code]) => code !== lang)
			.map(([code, label]) => ({
				code,
				label,
				link: links.get(code) ?? `/${code}`,
				available: availableLangs ? availableLangs.includes(code) : true
			}))
	);
</script>

<div class="relative" use:clickOutside={() => (open = false)}>
	<button
		type="button"
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="menu"
		class="flex border border-zinc-200 items-center rounded text-sm px-1.5 gap-1 py-1 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
	>
		<TranslateIcon class="size-4 text-zinc-900" />
		{LANG_LABELS.get(lang)}
	</button>
	{#if open}
		<div
			transition:fly={{ y: -4, duration: 200 }}
			class="absolute top-full left-0 mt-5 shadow-2xl divide-y divide-zinc-100 rounded-md bg-white text-sm {panelClass}"
		>
			{#each options as option (option.code)}
				<a
					href={option.link}
					hreflang={BCP47.get(option.code)}
					lang={BCP47.get(option.code)}
					onclick={() => (open = false)}
					class="block p-4 w-32 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600 {option.available
						? ''
						: 'opacity-70'}"
					title={option.available ? undefined : label.language_unavailable}
				>
					{option.label}
					{#if !option.available && availableLangs}
						<span class="ml-2 text-xs text-zinc-500">{label.homepage_fallback}</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

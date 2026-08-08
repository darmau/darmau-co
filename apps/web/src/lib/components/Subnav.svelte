<script lang="ts">
	import { page } from '$app/state';
	import { getSiteContext } from '$lib/context';
	import SubNavItems from '$lib/locales/subnav';
	import NavbarItems from '$lib/locales/navbar';

	let { active }: { active: string } = $props();

	const site = getSiteContext();
	const items = $derived(SubNavItems(site.lang, active));

	// active 是内部分组键（article / photography / others / about），
	// 直接当 aria-label 会让读屏念出英文代号。复用主导航里对应分组的名字。
	const GROUP_TO_NAV_TYPE: Record<string, string> = {
		article: 'article',
		photography: 'album',
		others: 'thought',
		about: 'about'
	};

	const groupLabel = $derived(
		NavbarItems(site.lang).find((item) => item.type === GROUP_TO_NAV_TYPE[active])?.name ?? active
	);

	// active 原本只用来选菜单项数组，当前项在渲染时没有任何标记：
	// 视觉上看不出在哪一页，读屏也听不出来。这里按 URL 判断当前项。
	const currentPath = $derived(page.url.pathname);
</script>

<nav
	aria-label={groupLabel}
	class="flex gap-8 justify-center p-4 border-b border-zinc-200 z-10 relative"
>
	{#each items as item (item.link)}
		{@const isCurrent = currentPath === item.link || currentPath.startsWith(`${item.link}/`)}
		<a
			class="text-sm rounded-sm hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 {isCurrent
				? 'font-medium text-violet-700'
				: 'text-zinc-500 hover:font-medium'}"
			aria-current={isCurrent ? 'page' : undefined}
			href={item.link}
		>
			{item.name}
		</a>
	{/each}
</nav>

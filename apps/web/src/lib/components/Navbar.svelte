<script lang="ts">
	import { fly } from 'svelte/transition';
	import throttle from 'lodash/throttle';
	import { page } from '$app/state';
	import type { NavItem } from '$lib/locales/navbar';
	import Bars3Icon from '$icons/Bars3.svelte';
	import MagnifyingGlassIcon from '$icons/MagnifyingGlass.svelte';
	import XMarkIcon from '$icons/XMark.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import Profile from './Profile.svelte';
	import { modal } from '$lib/actions/modal';
	import UIText from '$lib/locales/ui';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	let { lang, items }: { lang: string; items: NavItem[] } = $props();

	const label = $derived(getLanguageLabel(UIText, lang));

	// 一级路径 -> 导航项 type，用来判断当前高亮哪个 tab
	const PATH_MAP = new Map([
		['', 'article'],
		['articles', 'article'],
		['albums', 'album'],
		['thoughts', 'thought'],
		['about', 'about'],
		['site', 'about'],
		['contact', 'about'],
		['rss', 'about']
	]);

	let mobileMenuOpen = $state(false);
	let navbar = $state<HTMLElement | null>(null);

	const currentTab = $derived(PATH_MAP.get(page.url.pathname.split('/')[2] ?? ''));

	$effect(() => {
		let lastScrollTop = 0;

		// 向下滚动时收起导航栏，向上滚动时露出来
		const handleScroll = throttle(() => {
			const scrollTop = window.scrollY ?? document.documentElement.scrollTop;
			// 键盘焦点还在导航栏里时不收起，否则焦点元素会被移出视口（WCAG 2.4.11）
			const holdsFocus = !!navbar && navbar.contains(document.activeElement);
			const shouldHide = scrollTop > lastScrollTop && scrollTop > 120 && !holdsFocus;
			if (navbar) navbar.style.top = shouldHide ? 'calc(var(--navbar-height) * -1)' : '0';
			lastScrollTop = scrollTop;
		}, 200);

		window.addEventListener('scroll', handleScroll);
		return () => {
			handleScroll.cancel();
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<header
	bind:this={navbar}
	id="navbar"
	class="bg-white isolate z-40 fixed top-0 w-full transition-all duration-300"
>
	<nav aria-label="Global" class="border-b border-zinc-200">
		<div class="max-w-8xl mx-auto flex items-center justify-between p-5 lg:px-8">
			<div class="hidden lg:flex lg:gap-2 lg:items-center">
				<a
					href="/{lang}"
					class="-m-1.5 p-1.5 flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					<img alt="" src="/logo.svg" class="h-8 w-8" width="32" height="32" />
					<span class="font-medium font-serif text-lg">积薪</span>
				</a>
				<div class="ml-2">
					<LanguageSwitcher {lang} />
				</div>
			</div>
			<div class="flex lg:hidden">
				<button
					type="button"
					onclick={() => (mobileMenuOpen = true)}
					aria-expanded={mobileMenuOpen}
					aria-controls="mobile-menu"
					class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					<span class="sr-only">{label.open_menu}</span>
					<Bars3Icon class="h-6 w-6" />
				</button>
			</div>
			<div class="hidden lg:absolute lg:left-1/2 -translate-x-1/2 lg:flex lg:gap-x-12">
				{#each items as item (item.link)}
					<a
						href={item.link}
						aria-current={currentTab === item.type ? 'page' : undefined}
						class="relative group inline-block px-2 py-1 rounded-md text-sm leading-6 text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 {currentTab ===
						item.type
							? 'font-bold'
							: 'font-medium'}"
					>
						<span class="group-hover:text-violet-700">{item.name}</span>
						<span
							class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:bg-violet-500 {currentTab ===
							item.type
								? 'bg-violet-600'
								: ''}"
						></span>
					</a>
				{/each}
			</div>
			<div class="flex items-center gap-3">
				<Profile {lang} />
				<a
					href="/{lang}/search"
					class="flex items-center gap-2 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					<span class="sr-only">{label.search}</span>
					<MagnifyingGlassIcon class="size-5 text-zinc-900" />
				</a>
			</div>
		</div>
	</nav>

	{#if mobileMenuOpen}
		<div class="lg:hidden">
			<!-- 遮罩层：点击关闭。焦点管理、Escape、滚动锁定由下面的 modal action 负责 -->
			<div
				class="fixed inset-0 bg-zinc-900/20"
				onclick={() => (mobileMenuOpen = false)}
				aria-hidden="true"
			></div>
			<div
				id="mobile-menu"
				role="dialog"
				aria-modal="true"
				aria-label={label.main_menu}
				tabindex="-1"
				use:modal={() => (mobileMenuOpen = false)}
				transition:fly={{ x: 320, duration: 200 }}
				class="bg-white z-50 fixed inset-y-0 right-0 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-zinc-900/10"
			>
				<div class="flex items-center justify-between">
					<a
						href="/{lang}"
						class="-m-1.5 p-1.5 flex items-center gap-4 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						<img alt="" src="/logo.svg" class="h-8 w-8" width="32" height="32" />
						<span class="font-medium font-serif text-lg">积薪</span>
					</a>
					<button
						type="button"
						onclick={() => (mobileMenuOpen = false)}
						class="-m-2.5 rounded-md p-2.5 text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						<span class="sr-only">{label.close_menu}</span>
						<XMarkIcon class="h-6 w-6" />
					</button>
				</div>
				<div class="mt-6 flow-root">
					<div class="-my-6 divide-y divide-zinc-500/10">
						<div class="space-y-2 py-6">
							{#each items as item (item.link)}
								<a
									href={item.link}
									aria-current={currentTab === item.type ? 'page' : undefined}
									onclick={() => (mobileMenuOpen = false)}
									class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 {currentTab ===
									item.type
										? 'text-violet-700'
										: ''}"
								>
									{item.name}
								</a>
							{/each}
						</div>
						<div class="pt-8 flex justify-between items-center">
							<LanguageSwitcher {lang} panelClass="z-60" />
							<Profile {lang} />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</header>

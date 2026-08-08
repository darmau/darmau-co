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

	let { lang, items }: { lang: string; items: NavItem[] } = $props();

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
			if (navbar) navbar.style.top = scrollTop > lastScrollTop && scrollTop > 120 ? '-88px' : '0';
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
	<nav aria-label="Global" class="border-b border-gray-200">
		<div class="max-w-8xl mx-auto flex items-center justify-between p-5 lg:px-8">
			<div class="hidden lg:flex lg:gap-2 lg:items-center">
				<a href="/{lang}" class="-m-1.5 p-1.5 flex items-center gap-2">
					<img alt="logo" src="/logo.svg" class="h-8 w-8" width="32" height="32" />
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
					class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
				>
					<span class="sr-only">Open Menu</span>
					<Bars3Icon class="h-6 w-6" />
				</button>
			</div>
			<div class="hidden lg:absolute lg:left-1/2 -translate-x-1/2 lg:flex lg:gap-x-12">
				{#each items as item (item.link)}
					<a
						href={item.link}
						class="relative group inline-block px-2 py-1 rounded-md text-sm leading-6 text-gray-900 focus:outline-none {currentTab ===
						item.type
							? 'font-bold'
							: 'font-medium'}"
					>
						<span class="group-hover:text-violet-700">{item.name}</span>
						<span
							class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full transition-all duration-300 group-hover:bg-violet-500 {currentTab ===
							item.type
								? 'bg-violet-500'
								: ''}"
						></span>
					</a>
				{/each}
			</div>
			<div class="flex items-center gap-3">
				<Profile {lang} />
				<a href="/{lang}/search" class="flex items-center gap-2">
					<span class="sr-only">Search</span>
					<MagnifyingGlassIcon class="size-5 text-gray-900" />
				</a>
			</div>
		</div>
	</nav>

	{#if mobileMenuOpen}
		<div class="lg:hidden">
			<!-- 遮罩层：点击关闭。headlessui 的 Dialog 自带这个行为 -->
			<button
				type="button"
				aria-label="Close menu"
				class="fixed inset-0 cursor-default"
				onclick={() => (mobileMenuOpen = false)}
			></button>
			<div
				transition:fly={{ x: 320, duration: 200 }}
				class="bg-white z-50 fixed inset-y-0 right-0 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<a href="/{lang}" class="-m-1.5 p-1.5">
							<img alt="logo" src="/logo.svg" class="h-8 w-8" width="32" height="32" />
						</a>
						<span class="font-medium font-serif text-lg">积薪</span>
					</div>
					<button
						type="button"
						onclick={() => (mobileMenuOpen = false)}
						class="-m-2.5 rounded-md p-2.5 text-gray-700"
					>
						<span class="sr-only">Close menu</span>
						<XMarkIcon class="h-6 w-6" />
					</button>
				</div>
				<div class="mt-6 flow-root">
					<div class="-my-6 divide-y divide-gray-500/10">
						<div class="space-y-2 py-6">
							{#each items as item (item.link)}
								<a
									href={item.link}
									onclick={() => (mobileMenuOpen = false)}
									class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
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

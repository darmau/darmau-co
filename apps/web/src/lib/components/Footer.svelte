<script lang="ts">
	import GithubIcon from '$icons/Github.svelte';
	import InstagramIcon from '$icons/Instagram.svelte';
	import NotAIIcon from '$icons/NotAI.svelte';
	import RSSIcon from '$icons/RSS.svelte';
	import TwitterIcon from '$icons/Twitter.svelte';
	import YoutubeIcon from '$icons/Youtube.svelte';
	import type { footerLinks } from '$lib/utils/getFooterLabels';

	let {
		lang,
		currentYear,
		items
	}: { lang: string; currentYear: number; items: footerLinks[] } = $props();

	const social = [
		{ name: 'GitHub', href: 'https://github.com/darmau', icon: GithubIcon },
		{ name: 'X', href: 'https://x.com/darmau8964', icon: TwitterIcon },
		{ name: 'Instagram', href: 'https://www.instagram.com/ridamoe', icon: InstagramIcon },
		{ name: 'YouTube', href: 'https://www.youtube.com/@darmau', icon: YoutubeIcon }
	];
</script>

<footer aria-labelledby="footer-heading" class="bg-white border-t border-gray-200">
	<h2 id="footer-heading" class="sr-only">Footer</h2>
	<div class="mx-auto max-w-8xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
		<div class="xl:grid xl:grid-cols-2 xl:gap-8">
			<div>
				<img alt="积薪" src="/logo.svg" class="h-12 mb-4" />
				{#if lang === 'jp'}
					<a
						href="https://blog.with2.net/link/?id=2136562&follow"
						title="人気ブログランキングでフォロー"
						target="_blank"
						rel="noreferrer"
					>
						<img
							alt="人気ブログランキングでフォロー"
							width="235"
							height="46"
							src="https://blog.with2.net/banner/follow/2136562?t=b"
						/>
					</a>
				{/if}
			</div>
			<div class="my-16 grid grid-cols-2 lg:grid-cols-4 gap-8 xl:mt-0">
				{#each items ?? [] as block (block.name)}
					<div class="flex flex-col gap-4">
						<h3 class="text-sm font-semibold leading-6 text-gray-900">{block.name}</h3>
						{#each block.items as item (item.href)}
							<a href={item.href} class="text-sm leading-6 text-zinc-600 hover:text-zinc-900">
								{item.name}
							</a>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-8 border-t border-gray-900/10 pt-8 md:flex md:items-center md:justify-between">
			<div class="flex space-x-6 md:order-2">
				<a href="/{lang}/rss" class="text-gray-400 hover:text-gray-500">
					<span class="sr-only">RSS</span>
					<RSSIcon class="h-6 w-6" />
				</a>
				{#each social as item (item.name)}
					<a
						href={item.href}
						target="_blank"
						rel="noreferrer"
						class="text-gray-400 hover:text-gray-500"
					>
						<span class="sr-only">{item.name}</span>
						<item.icon aria-hidden="true" class="h-6 w-6" />
					</a>
				{/each}
			</div>
			<NotAIIcon class="mt-8 md:order-1 md:mt-0" />
			<p class="mt-8 text-xs leading-5 text-gray-500 md:order-0 md:mt-0">
				&copy; 2019 - {currentYear} Design and Develop by 李大毛. All rights reserved.
			</p>
		</div>
	</div>
</footer>

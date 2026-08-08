<script lang="ts">
	import GithubIcon from '$icons/Github.svelte';
	import InstagramIcon from '$icons/Instagram.svelte';
	import TwitterIcon from '$icons/Twitter.svelte';
	import YoutubeIcon from '$icons/Youtube.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import Subnav from '$components/Subnav.svelte';
	import HomepageText from '$lib/locales/homepage';
	import type { Image } from '$lib/types/Image';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import { serializeStructuredData } from '$lib/utils/structuredData';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lang = $derived(data.lang);
	const label = $derived(getLanguageLabel(HomepageText, lang));
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/ba07adad-3f02-409b-ad39-2814b6f2ede3`
	);

	const socials = [
		{ name: 'Twitter', href: 'https://x.com/darmau8964', icon: TwitterIcon },
		{ name: 'Github', href: 'https://github.com/Darmau', icon: GithubIcon },
		{ name: 'Instagram', href: 'https://www.instagram.com/ridamoe', icon: InstagramIcon },
		{ name: 'YouTube', href: 'https://www.youtube.com/@darmau', icon: YoutubeIcon }
	];
</script>

<svelte:head>
	<title>{label.about_title}</title>
	<meta name="description" content={label.about_description} />
	<meta property="og:title" content={label.about_title} />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content="{data.baseUrl}/{lang}/about" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={label.about_description} />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:title" content={label.about_title} />
	<meta property="twitter:description" content={label.about_description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
	{@html `<script type="application/ld+json">${serializeStructuredData(data.structuredData)}</script>`}
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="about" />

<Subnav active="about" />
<div
	class="w-full max-w-6xl mx-auto p-4 md:py-8 my-8 lg:my-16 grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12"
>
	<div class="lg:pl-20">
		{#if data.profileImage}
			<ResponsiveImage
				image={data.profileImage as Image}
				width={560}
				classList="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover"
			/>
		{/if}
	</div>
	<div class="lg:order-first lg:row-span-2">
		<h1
			class="text-4xl leading-tight sm:leading-tight font-bold tracking-tight text-zinc-800 sm:text-5xl"
		>
			{data.content[0]}
		</h1>
		<div class="mt-8 space-y-7 text-base text-zinc-600">
			{#each data.content.slice(1) as text, index (index)}
				<p class="leading-relaxed">{text}</p>
			{/each}
		</div>
	</div>
	<div class="lg:pl-20 space-y-6">
		{#each socials as social (social.name)}
			<div class="group flex justify-start gap-4">
				<social.icon class="w-6 h-6 text-zinc-700 group-hover:text-violet-700" />
				<a
					href={social.href}
					target="_blank"
					rel="noreferrer"
					class="font-medium text-gray-700 group-hover:text-violet-700"
				>
					{social.name}
				</a>
			</div>
		{/each}
	</div>
</div>

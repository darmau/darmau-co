<script lang="ts">
	import AlbumMasonry from '$lib/components/AlbumMasonry.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import FootprintMap from '$lib/components/maps/FootprintMap.svelte';
	import { localize } from '$lib/i18n';
	import { ogImageUrl } from '$lib/image';

	let { data } = $props();
	const t = $derived(data.t);
</script>

<Seo
	title={`${t.siteName} — ${t.siteTag}`}
	description={t.siteDescription}
	image={data.hero ? ogImageUrl(data.imgPrefix, data.hero.cover.storageKey) : undefined}
/>

<Nav overlay={!!data.hero} />

<main>
	{#if data.hero}
		<Hero album={data.hero} />
	{/if}

	<section class="albums" aria-labelledby="albums-heading">
		<header class="section-head">
			<h2 id="albums-heading">{t.albumsHeading}</h2>
			<a class="label" href={localize(data.lang, '/albums')}>{t.albumsAll} <span class="mono accent">{data.total}</span></a>
		</header>
		<AlbumMasonry albums={data.albums} total={data.total} />
	</section>

	<section id="map" class="footprint" aria-labelledby="map-heading">
		<header class="section-head">
			<h2 id="map-heading">{t.mapHeading}</h2>
			<p class="label">{t.mapHint}</p>
		</header>
		<FootprintMap points={data.points} token={data.mapboxToken} />
	</section>
</main>

<Footer />

<style>
	.albums {
		padding-top: 72px;
	}

	.footprint {
		padding-top: 96px;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 0 var(--page-x) 24px;
	}

	h2 {
		font-size: 32px;
		font-weight: 700;
		font-stretch: 112%;
		line-height: 1;
	}

	.section-head a:hover {
		color: var(--text);
	}
</style>

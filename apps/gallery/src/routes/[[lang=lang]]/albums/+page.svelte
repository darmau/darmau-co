<script lang="ts">
	import AlbumMasonry from '$lib/components/AlbumMasonry.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { fmt } from '$lib/i18n';

	let { data } = $props();
	const t = $derived(data.t);
</script>

<Seo title={`${t.albumsAll} — ${t.siteName}`} description={t.siteDescription} />

<Nav />

<main>
	<header class="head">
		<h1>{t.albumsAll}</h1>
		<p class="label"><span class="accent">{data.albums.length}</span> · {fmt(t.photos, { n: data.albums.reduce((n, a) => n + a.photoCount, 0) })}</p>
	</header>
	<AlbumMasonry albums={data.albums} />
</main>

<Footer />

<style>
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 56px var(--page-x) 32px;
	}

	h1 {
		font-size: clamp(40px, 6vw, 72px);
		font-weight: 700;
		font-stretch: 112%;
		line-height: 1;
	}

	main {
		padding-bottom: 72px;
	}
</style>

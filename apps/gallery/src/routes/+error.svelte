<script lang="ts">
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import { localize } from '$lib/i18n';

	const t = $derived(page.data.t);
</script>

<svelte:head><title>{page.status} — LI DAMAO</title></svelte:head>

{#if t}<Nav />{/if}

<main>
	<p class="code mono accent">{page.status}</p>
	<h1>{page.status === 404 ? (t?.notFound ?? 'Page not found') : (page.error?.message ?? 'Error')}</h1>
	<a class="btn" href={localize(page.data.lang ?? 'zh', '/')}>{t?.backHome ?? 'Home'}</a>
</main>

<style>
	main {
		display: grid;
		justify-items: start;
		gap: 20px;
		padding: 120px var(--page-x);
		min-height: 60vh;
	}

	.code {
		font-size: 14px;
		letter-spacing: 0.2em;
	}

	h1 {
		font-size: clamp(36px, 5vw, 64px);
		font-weight: 700;
		font-stretch: 112%;
		line-height: 1;
	}
</style>

<script lang="ts">
	import { page } from '$app/state';
	import { LANGS, localize, stripLang, type Lang } from '$lib/i18n';

	/** overlay：叠在首页主图上，背景透明 */
	let { overlay = false }: { overlay?: boolean } = $props();

	const lang = $derived(page.data.lang as Lang);
	const t = $derived(page.data.t);
	const basePath = $derived(stripLang(page.url.pathname));
	const onAlbums = $derived(basePath.startsWith('/albums'));
</script>

<header class="nav" class:overlay>
	<a class="logo" href={localize(lang, '/')}>
		<span class="wordmark">{t.siteName}</span>
		<span class="tag mono">{t.siteTag}</span>
	</a>

	<nav aria-label={t.mainNav}>
		<ul class="links">
			<li><a href={localize(lang, '/albums')} aria-current={onAlbums ? 'page' : undefined}>{t.nav.albums}</a></li>
			<li><a href={`${localize(lang, '/')}#map`}>{t.nav.map}</a></li>
			<li><a href="#about">{t.nav.about}</a></li>
		</ul>
	</nav>

	<ul class="langs mono" aria-label={t.switchLang}>
		{#each LANGS as code (code)}
			<li>
				<a
					href={localize(code, basePath)}
					hreflang={code}
					lang={code}
					aria-current={code === lang ? 'true' : undefined}
					aria-label={t.langLabel[code]}
					data-sveltekit-preload-data="off">{t.langName[code]}</a
				>
			</li>
		{/each}
	</ul>
</header>

<style>
	.nav {
		display: flex;
		align-items: center;
		gap: 32px;
		padding: 22px var(--page-x);
		border-bottom: 1px solid var(--line);
		background: var(--bg);
	}

	.overlay {
		position: absolute;
		inset: 0 0 auto;
		z-index: 10;
		background: transparent;
		border-bottom-color: transparent;
		/* 主图顶部可能是亮天空，加一层很淡的遮罩保证文字可读 */
		background-image: linear-gradient(to bottom, rgb(7 7 7 / 0.72), rgb(7 7 7 / 0.3) 70%, transparent);
	}

	.logo {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-right: auto;
	}

	.wordmark {
		font-size: 20px;
		font-weight: 800;
		font-stretch: 125%;
		letter-spacing: 0.02em;
		line-height: 1;
	}

	.tag {
		font-size: 10px;
		letter-spacing: 0.24em;
		color: var(--muted);
	}

	ul {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.links {
		gap: 28px;
		font-size: 14px;
	}

	.links a,
	.langs a {
		color: var(--text-2);
		transition: color 0.2s var(--ease);
	}

	.links a:hover,
	.langs a:hover {
		color: var(--text);
	}

	.links a[aria-current] {
		color: var(--text);
	}

	.langs {
		gap: 2px;
		font-size: 12px;
		padding-left: 24px;
		border-left: 1px solid var(--line);
	}

	.langs a {
		display: grid;
		place-items: center;
		min-width: 32px;
		height: 32px;
	}

	.langs a[aria-current] {
		color: var(--accent);
	}

	@media (max-width: 720px) {
		.nav {
			flex-wrap: wrap;
			gap: 12px 20px;
			padding-block: 16px;
		}

		.tag {
			display: none;
		}

		nav {
			order: 3;
			width: 100%;
		}

		.links {
			gap: 20px;
		}

		.langs {
			padding-left: 0;
			border-left: 0;
		}
	}
</style>

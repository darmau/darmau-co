<script lang="ts">
	import { page } from '$app/state';

	const t = $derived(page.data.t);
	const year = new Date().getFullYear();

	// 与博客页脚一致
	const social = [
		{ name: 'darmau.co', href: 'https://darmau.co' },
		{ name: 'Instagram', href: 'https://www.instagram.com/ridamoe' },
		{ name: 'X', href: 'https://x.com/darmau8964' },
		{ name: 'GitHub', href: 'https://github.com/darmau' }
	];
</script>

<footer id="about">
	<div class="intro">
		<p class="label">{t.footer.about}</p>
		<p class="name">{t.siteName}</p>
		<p class="text">{t.footer.intro}</p>
	</div>

	<ul class="social">
		{#each social as link (link.href)}
			<li>
				<a href={link.href} rel="me noopener" target="_blank">
					{link.name === 'darmau.co' ? `${t.footer.blog} · darmau.co` : link.name}
					<span aria-hidden="true">↗</span>
				</a>
			</li>
		{/each}
	</ul>

	<p class="copyright mono">© {year} DARMAU · {t.footer.rights}</p>
</footer>

<style>
	footer {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 40px var(--page-x);
		padding: 72px var(--page-x) 40px;
		border-top: 1px solid var(--line);
	}

	.intro {
		display: grid;
		gap: 12px;
		max-width: 520px;
	}

	.name {
		font-size: 28px;
		font-weight: 800;
		font-stretch: 125%;
		line-height: 1;
	}

	.text {
		color: var(--text-2);
	}

	.social {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		align-content: start;
		gap: 10px;
		font-size: 14px;
	}

	.social a {
		color: var(--text-2);
	}

	.social a:hover {
		color: var(--text);
	}

	.copyright {
		grid-column: 1 / -1;
		padding-top: 24px;
		border-top: 1px solid var(--line);
		font-size: 11px;
		color: var(--muted);
	}

	@media (max-width: 720px) {
		footer {
			grid-template-columns: 1fr;
		}
	}
</style>

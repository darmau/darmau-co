<script module lang="ts">
	export interface BreadcrumbProps {
		name: string;
		to: string;
		current?: boolean;
	}
</script>

<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import HomeSolid from '$icons/HomeSolid.svelte';

	let { pages }: { pages: BreadcrumbProps[] } = $props();

	const site = getSiteContext();
	const homeLabel = $derived(site.lang === 'zh' ? '首页' : site.lang === 'jp' ? 'ホーム' : 'Home');
</script>

<nav aria-label="Breadcrumb" class="flex my-4">
	<ol class="flex items-center space-x-4">
		<li>
			<div>
				<a
					href="/{site.lang}"
					class="rounded-sm text-zinc-500 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					aria-label={homeLabel}
				>
					<HomeSolid class="h-5 w-5 shrink-0" />
				</a>
			</div>
		</li>
		{#each pages as page (page.name)}
			<li>
				<div class="flex items-center">
					<svg
						fill="currentColor"
						viewBox="0 0 20 20"
						aria-hidden="true"
						class="h-5 w-5 shrink-0 text-zinc-300"
					>
						<path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
					</svg>
					<a
						href="/{site.lang}/{page.to}"
						aria-current={page.current ? 'page' : undefined}
						class="ml-4 rounded-sm text-sm font-medium text-zinc-500 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						{page.name}
					</a>
				</div>
			</li>
		{/each}
	</ol>
</nav>

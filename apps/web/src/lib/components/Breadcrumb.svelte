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
				<a href="/{site.lang}" class="text-gray-400 hover:text-gray-500" aria-label={homeLabel}>
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
						class="h-5 w-5 shrink-0 text-gray-300"
					>
						<path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
					</svg>
					<a
						href="/{site.lang}/{page.to}"
						aria-current={page.current ? 'page' : undefined}
						class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
					>
						{page.name}
					</a>
				</div>
			</li>
		{/each}
	</ol>
</nav>

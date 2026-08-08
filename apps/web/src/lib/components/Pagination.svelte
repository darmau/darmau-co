<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import Labels from '$locales/utils';
	import getLanguageLabel from '$utils/getLanguageLabel';

	function generatePages(count: number, limit: number, page: number): (number | string)[] {
		let pages: (number | string)[] = [];
		const total = Math.ceil(count / limit);
		if (total <= 5) {
			for (let i = 1; i <= total; i++) {
				pages.push(i);
			}
		} else {
			if (page <= 3) {
				pages = [1, 2, 3, 4, 5, '...', total];
			} else if (page >= total - 2) {
				pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
			} else {
				pages = [1, '...', page - 1, page, page + 1, '...', total];
			}
		}
		return pages;
	}

	let {
		count,
		limit,
		page,
		path
	}: { count: number; limit: number; page: number; path: string } = $props();

	const site = getSiteContext();
	const pages = $derived(generatePages(count, limit, page));
	const label = $derived(getLanguageLabel(Labels, site.lang));
</script>

<div class="flex justify-between flex-wrap gap-4 items-center">
	<div class="text-sm text-zinc-500">
		{label.total}: {count}
	</div>
	<nav class="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
		{#if page === 1}
			<div
				class="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-300 ring-1 ring-inset ring-zinc-300 bg-zinc-50"
			>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		{:else}
			<a
				href="{path}/{page - 1}"
				class="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0"
			>
				<span class="sr-only">{label.prev_page}</span>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
		{/if}
		{#each pages as p, index (index)}
			{#if p === '...'}
				<span
					class="relative inline-flex items-center px-4 py-2 -ml-px text-zinc-700 ring-1 ring-inset ring-zinc-300"
				>
					...
				</span>
			{:else}
				<a
					class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 hover:text-violet-600 focus:z-20 focus:outline-offset-0"
					href="{path}/{p}"
				>
					{p}
				</a>
			{/if}
		{/each}
		{#if page === Math.ceil(count / limit)}
			<div
				class="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-300 ring-1 ring-inset ring-zinc-300 bg-zinc-50"
			>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		{:else}
			<a
				href="{path}/{page + 1}"
				class="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0"
			>
				<span class="sr-only">{label.next_page}</span>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
		{/if}
	</nav>
</div>

<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import SubNavItems from '$lib/locales/subnav';

	let { active }: { active: string } = $props();

	const site = getSiteContext();
	const items = $derived(SubNavItems(site.lang, active));
</script>

<div class="flex gap-8 justify-center p-4 border-b border-gray-200 z-10 relative">
	{#each items as item (item.link)}
		<a class="text-sm hover:text-violet-700 hover:font-medium text-zinc-500" href={item.link}>
			{item.name}
		</a>
	{/each}
</div>

<script lang="ts">
	import { getBannerCopy } from '$lib/locales/banner';
	import XMarkIcon from '$icons/XMarkSolid.svelte';

	let { lang }: { lang: string } = $props();

	const STORAGE_KEY = 'firewood.community-banner.dismissed';

	// SSR 时读不到 localStorage，先按隐藏渲染，挂载后再决定是否显示
	let visible = $state(false);

	const copy = $derived(getBannerCopy(lang));

	$effect(() => {
		if (!localStorage.getItem(STORAGE_KEY)) visible = true;
	});

	function dismiss() {
		visible = false;
		localStorage.setItem(STORAGE_KEY, 'true');
	}
</script>

{#if visible}
	<div
		class="z-50 pointer-events-none fixed inset-x-0 bottom-0 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8"
	>
		<div
			class="pointer-events-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-gray-900 px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4 dark:bg-gray-800 dark:inset-ring dark:inset-ring-white/10"
		>
			<div class="flex-1 text-white">
				<p class="text-sm/6 text-gray-100">{copy.body}</p>
			</div>
			<div class="flex items-center gap-x-4">
				<button
					type="button"
					onclick={dismiss}
					class="-m-1.5 flex-none rounded p-1.5 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					<span class="sr-only">Dismiss</span>
					<XMarkIcon class="size-5" />
				</button>
			</div>
		</div>
	</div>
{/if}

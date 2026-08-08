<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import UIText from '$lib/locales/ui';
	import type { SearchResult } from '$lib/types/SearchResult';
	import { decodeRFC2047 } from '$utils/decodeRFC2047';
	import getLanguageLabel from '$utils/getLanguageLabel';

	type AutoRagFileAttribute = {
		title?: string;
		description?: string;
		image?: string;
	};

	function getFileAttribute(attrs: Record<string, unknown>): AutoRagFileAttribute | undefined {
		const file = attrs.file;
		if (file && typeof file === 'object') {
			return file as AutoRagFileAttribute;
		}
		return undefined;
	}

	let { result }: { result: SearchResult } = $props();

	const site = getSiteContext();
	const uiLabel = $derived(getLanguageLabel(UIText, site.lang));
	const file = $derived(getFileAttribute(result.attributes));
	const decodedTitle = $derived(file?.title ? decodeRFC2047(file.title) : '');
	const decodedDescription = $derived(file?.description ? decodeRFC2047(file.description) : '');
</script>

<div
	class="flex justify-between gap-4 border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow"
>
	<div class="">
		<!-- 结果列表项的标题，页面 h1 -> h2（结果区标题）-> h3 -->
		<h3 class="text-xl font-medium text-violet-900">
			<a
				href={result.filename}
				target="_blank"
				rel="noopener noreferrer"
				class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{decodedTitle}
				<span class="sr-only">{uiLabel.opens_in_new_window}</span>
			</a>
		</h3>
		<p class="text-sm text-zinc-600 mt-1">
			{decodedDescription}
		</p>
	</div>

	{#if file?.image}
		<!-- 缩略图内容和上面的标题完全一样，给了 alt 读屏会念两遍，所以标记为装饰性图片 -->
		<img src={file.image} alt="" class="rounded w-40 h-40 object-cover" />
	{/if}
</div>

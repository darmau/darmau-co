<script lang="ts">
	import type { SearchResult } from '$lib/types/SearchResult';
	import { decodeRFC2047 } from '$utils/decodeRFC2047';

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

	const file = $derived(getFileAttribute(result.attributes));
	const decodedTitle = $derived(file?.title ? decodeRFC2047(file.title) : '');
	const decodedDescription = $derived(file?.description ? decodeRFC2047(file.description) : '');
</script>

<div
	class="flex justify-between gap-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
>
	<div class="">
		<a href={result.filename} target="_blank" rel="noopener noreferrer">
			<h4 class="text-xl font-medium text-violet-900">
				{decodedTitle}
			</h4>
		</a>
		<p class="text-sm text-gray-600 mt-1">
			{decodedDescription}
		</p>
	</div>

	{#if file?.image}
		<img
			src={file.image}
			alt={decodedTitle || result.filename}
			class="rounded w-40 h-40 object-cover"
		/>
	{/if}
</div>

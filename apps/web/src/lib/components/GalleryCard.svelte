<script lang="ts">
	import type { GalleryItem } from '$lib/types/Gallery';
	import getTime from '$lib/utils/getTime';

	let {
		item,
		lang,
		prefix
	}: {
		item: GalleryItem;
		lang: string;
		prefix: string;
	} = $props();

	// 根据图片数量返回对应的 grid 布局类名
	const getGridClass = (count: number): string => {
		switch (count) {
			case 1:
				return 'grid-cols-1';
			case 2:
				return 'grid-cols-2';
			case 3:
				return 'grid-cols-3';
			case 4:
				return 'grid-cols-2';
			default:
				// 5+ 图片：3x3 网格
				return 'grid-cols-3';
		}
	};

	const href = $derived(
		item.type === 'photo'
			? `/${lang}/album/${item.slug ?? item.id}`
			: `/${lang}/thought/${item.slug ?? item.id}`
	);

	const images = $derived(item.images);

	// 最多显示 9 张图片
	const displayImages = $derived(images.slice(0, 9));
	const remainingCount = $derived(images.length - 9);
	const gridClass = $derived(getGridClass(images.length));
</script>

{#if images.length > 0}
	<li class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			{#if item.type === 'photo' && item.title}
				<a {href} class="text-xl font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
					{item.title}
				</a>
			{/if}
		</div>

		{#if item.type === 'thought' && item.content}
			<a {href} class="block text-sm text-zinc-700 line-clamp-3">
				{item.content}
			</a>
		{/if}

		<time class="text-sm text-zinc-500 tabular-nums">
			{getTime(item.createdAt, lang)}
		</time>

		<a {href} class="grid {gridClass} gap-1 rounded-lg overflow-hidden">
			{#each displayImages as image, index (image.id)}
				<div class="relative overflow-hidden aspect-square">
					<img
						src="{prefix}/cdn-cgi/image/format=auto,width=720/{image.storage_key}"
						alt={image.alt ?? ''}
						class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
						loading="lazy"
					/>
					{#if index === 8 && remainingCount > 0}
						<div class="absolute inset-0 bg-black/50 flex items-center justify-center">
							<span class="text-white text-2xl font-semibold">+{remainingCount}</span>
						</div>
					{/if}
				</div>
			{/each}
		</a>
	</li>
{/if}

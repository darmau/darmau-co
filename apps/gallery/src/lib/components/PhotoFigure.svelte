<script lang="ts">
	import * as f from '$lib/format';
	import type { Photo } from '$lib/types';
	import Picture from './Picture.svelte';

	let { photo, sizes }: { photo: Photo; sizes: string } = $props();

	const exif = $derived(f.exifLine(photo.exif));
</script>

<!-- 照片没有标题：编号 + 拍摄时间 + 参数 + 位置，有手记时再加一行 -->
<figure id={`photo-${photo.index}`} style:--ratio={photo.width / photo.height}>
	<Picture image={photo} {sizes} />
	<figcaption>
		<p class="head mono">
			<span class="accent">{f.pad(photo.index)}</span>
			{#if photo.takenAt}<time datetime={photo.takenAt}>{f.shortDateTime(photo.takenAt)}</time>{/if}
		</p>
		{#if exif.length}
			<p class="exif mono">
				{#each exif as item, i (i)}<span>{item}</span>{/each}
			</p>
		{/if}
		{#if photo.coord}
			<p class="where mono">
				{#if photo.place}<span class="place">{photo.place.name}</span>{/if}
				<span>{f.coord(photo.coord)}</span>
			</p>
		{/if}
		{#if photo.note}<p class="note">{photo.note}</p>{/if}
	</figcaption>
</figure>

<style>
	figure {
		margin: 0;
		min-width: 0;
	}

	figcaption {
		display: grid;
		gap: 4px;
		padding: 14px 4px 0;
	}

	.head {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--muted);
	}

	.exif,
	.where {
		display: flex;
		flex-wrap: wrap;
		gap: 0 14px;
		font-size: 11px;
		color: var(--text-2);
	}

	/* 参数之间用细竖线分隔 */
	.exif span + span::before {
		content: '/';
		margin-right: 14px;
		color: var(--line);
	}

	.where {
		color: var(--muted);
	}

	.place {
		font-family: var(--font-sans);
		color: var(--text-2);
	}

	.note {
		max-width: 64ch;
		margin-top: 6px;
		font-size: 14px;
		color: var(--text-2);
	}
</style>

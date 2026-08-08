<script lang="ts">
	import GalleryImage from '$components/GalleryImage.svelte';
	import type { GalleryPhoto } from '$lib/utils/generatePhotoAlbum';

	let { photos }: { photos: GalleryPhoto[] } = $props();
</script>

<!--
	替代原来的 react-photo-album（layout="masonry"、spacing={0}、breakpoints=[480,720,960]）。
	纯 CSS 多列实现：容器宽度 <480 一列，<720 两列，<960 三列，其余四列，
	子项 break-inside-avoid 防止被拆到两列里。
-->
<div class="columns-1 min-[480px]:columns-2 min-[720px]:columns-3 min-[960px]:columns-4">
	{#each photos as photo (photo.key)}
		<a
			href={photo.href}
			class="group m-1 md:m-2 relative rounded-md overflow-hidden block break-inside-avoid"
		>
			<div class="z-20 absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent">
				<div
					class="transform translate-y-full transition-transform duration-300 group-hover:translate-y-0 p-4"
				>
					<p class="text-white font-medium text-base">{photo.title}</p>
				</div>
			</div>
			<GalleryImage image={photo} width={640} classList="w-full h-full group" />
		</a>
	{/each}
</div>

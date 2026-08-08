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
		<!--
			瀑布流每张图比例都不同，没法用固定的 aspect-* class；
			GalleryImage 里的 img 也没有 height 属性，浏览器推不出比例，
			图片加载完成的瞬间整列会往下抖。这里用原图宽高直接把盒子的比例定死。
		-->
		<a
			href={photo.href}
			style="aspect-ratio: {photo.width} / {photo.height}"
			class="group m-1 md:m-2 relative rounded-md overflow-hidden block break-inside-avoid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
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

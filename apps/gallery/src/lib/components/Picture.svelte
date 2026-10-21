<script lang="ts">
	import { getImgPrefix } from '$lib/context';
	import { imageUrl, placeholderUrl, srcset } from '$lib/image';

	interface Props {
		image: { storageKey: string; width: number; height: number; alt: string };
		sizes: string;
		/** 首屏主图：不懒加载，fetchpriority=high */
		priority?: boolean;
		/** cover 用于主图这类铺满容器的场景；默认按原比例完整显示 */
		fit?: 'natural' | 'cover' | 'contain';
		/** srcset 的最大档位，见 lib/image.ts srcset() */
		maxWidth?: number;
		class?: string;
	}

	let { image, sizes, priority = false, fit = 'natural', maxWidth, class: className = '' }: Props = $props();

	const prefix = getImgPrefix();
	let loaded = $state(false);

	// SSR 输出的 <img> 可能在水合前就加载完了，load 事件不会再触发，所以挂载时补查一次
	function checkComplete(node: HTMLImageElement) {
		if (node.complete && node.naturalWidth > 0) loaded = true;
	}
</script>

<div
	class="picture {fit} {className}"
	class:loaded
	style:aspect-ratio={fit === 'natural' ? `${image.width} / ${image.height}` : undefined}
	style:background-image={`url("${placeholderUrl(prefix, image.storageKey)}")`}
>
	<img
		{@attach checkComplete}
		src={imageUrl(prefix, image.storageKey, Math.min(1600, maxWidth ?? 1600))}
		srcset={srcset(prefix, image.storageKey, image.width, maxWidth)}
		{sizes}
		width={image.width}
		height={image.height}
		alt={image.alt}
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding={priority ? 'sync' : 'async'}
		onload={() => (loaded = true)}
	/>
</div>

<style>
	.picture {
		position: relative;
		overflow: hidden;
		background-color: var(--surface);
		background-size: cover;
		background-position: center;
	}

	.picture.cover,
	.picture.contain {
		width: 100%;
		height: 100%;
	}

	.picture.contain {
		background-size: contain;
		background-repeat: no-repeat;
		background-color: transparent;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.6s var(--ease);
	}

	.contain img {
		object-fit: contain;
	}

	.loaded img {
		opacity: 1;
	}

	/* 没有 JS 时直接显示 */
	:global(html:not(.js)) img {
		opacity: 1;
	}
</style>

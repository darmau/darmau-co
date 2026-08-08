<script module lang="ts">
	export interface AlbumPhoto {
		order: number;
		image: {
			alt: string;
			caption: string;
			height: number;
			width: number;
			storage_key: string;
			exif: JSON;
			location: string;
			latitude?: number | null;
			longitude?: number | null;
		};
	}
</script>

<script lang="ts">
	import debounce from 'lodash/debounce';
	import ArrowsPointingOutIcon from '$icons/ArrowsPointingOut.svelte';
	import ChevronLeftIcon from '$icons/ChevronLeft.svelte';
	import ChevronRightIcon from '$icons/ChevronRight.svelte';
	import XMarkIcon from '$icons/XMark.svelte';
	import EXIF, { type EXIFProps } from '$components/EXIF.svelte';
	import { getSiteContext } from '$lib/context';
	import { trackViewFullscreen } from '$lib/utils/zaraz';
	import { modal } from '$lib/actions/modal';

	// 原实现用的是 yet-another-react-lightbox（Inline + Thumbnails + Captions 三个插件）。
	// 那个库没有 Svelte 版本，这里按原来的交互手写：内联轮播 + 缩略图条 + 全屏浮层。
	let {
		albumImages,
		onIndexChange,
		albumTitle
	}: {
		albumImages: AlbumPhoto[];
		onIndexChange: (index: number) => void;
		albumTitle?: string;
	} = $props();

	const site = getSiteContext();

	let index = $state(0);
	let fullscreen = $state(false);

	const current = $derived(albumImages[index]);

	const src = (photo: AlbumPhoto, width: number) =>
		`${site.prefix}/cdn-cgi/image/format=auto,width=${width}/${photo.image.storage_key}`;

	// 相册页要根据当前图切换地图标记，滑得快时不必每张都通知
	const notify = debounce((next: number) => onIndexChange(next), 300);

	$effect(() => () => notify.cancel());

	function go(next: number) {
		if (albumImages.length === 0) return;
		const wrapped = (next + albumImages.length) % albumImages.length;
		index = wrapped;
		notify(wrapped);
	}

	function openFullscreen() {
		fullscreen = true;
		if (albumTitle) trackViewFullscreen(albumTitle);
	}

	let carousel = $state<HTMLElement | null>(null);

	// 只在全屏时、或焦点落在轮播内部时才用方向键切图，否则会抢走整页的方向键滚动。
	// 全屏浮层里的 Escape 由 modal action 负责。
	function onKeydown(event: KeyboardEvent) {
		const active = document.activeElement;
		if (!fullscreen && !(carousel && active && carousel.contains(active))) return;
		if (event.key === 'ArrowLeft') go(index - 1);
		else if (event.key === 'ArrowRight') go(index + 1);
		else return;
		event.preventDefault();
	}

	// 缩略图按钮的可访问名：有 alt 就用 alt，避免 aria-label 把图片描述整个盖掉
	const thumbLabel = (photo: AlbumPhoto, i: number) =>
		photo.image.alt ? `${photo.image.alt} (${i + 1}/${albumImages.length})` : `${i + 1}`;
</script>

<svelte:window onkeydown={onKeydown} />

<div bind:this={carousel}>
	<div class="relative group">
		<div class="relative w-full max-w-7xl aspect-5/4 overflow-hidden">
			{#if current}
				<img
					src={src(current, 1280)}
					srcset="{src(current, 640)} 640w, {src(current, 1080)} 1080w, {src(current, 1920)} 1920w"
					sizes="(max-width: 720px) 100vw, 1280px"
					alt={current.image.alt}
					class="w-full h-full object-contain"
				/>
				<div
					class="hidden md:block p-4 absolute w-full bottom-0 bg-linear-to-t from-black/60 to-transparent text-white"
				>
					{#if current.image.caption}
						<p class="mb-4">{current.image.caption}</p>
					{/if}
					<EXIF exif={current.image.exif as unknown as EXIFProps} />
				</div>
			{/if}

			{#if albumImages.length > 1}
				<button
					type="button"
					aria-label="Previous"
					onclick={() => go(index - 1)}
					class="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
				>
					<ChevronLeftIcon aria-hidden="true" class="h-5 w-5 text-black" />
				</button>
				<button
					type="button"
					aria-label="Next"
					onclick={() => go(index + 1)}
					class="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
				>
					<ChevronRightIcon aria-hidden="true" class="h-5 w-5 text-black" />
				</button>
			{/if}
		</div>

		<button
			onclick={openFullscreen}
			type="button"
			aria-label="Full Screen"
			class="absolute top-8 right-8 z-50 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
		>
			<ArrowsPointingOutIcon aria-hidden="true" class="h-5 w-5" />
		</button>
	</div>

	{#if albumImages.length > 1}
		<div class="flex gap-4 overflow-x-auto py-4">
			{#each albumImages as photo, i (photo.image.storage_key)}
				<button
					type="button"
					onclick={() => go(i)}
					aria-label={thumbLabel(photo, i)}
					aria-current={i === index}
					class="shrink-0 w-24 h-20 overflow-hidden border-3 {i === index
						? 'border-zinc-600'
						: 'border-transparent'}"
				>
					<img
						src={src(photo, 240)}
						alt={photo.image.alt}
						loading="lazy"
						class="w-full h-full object-contain"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if fullscreen}
	<div
		role="dialog"
		aria-modal="true"
		aria-label={albumTitle ?? current?.image.alt ?? ''}
		tabindex="-1"
		use:modal={() => (fullscreen = false)}
		class="fixed inset-0 z-100 bg-black/95 flex flex-col"
	>
		<button
			type="button"
			aria-label="Close"
			onclick={() => (fullscreen = false)}
			class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
		>
			<XMarkIcon aria-hidden="true" class="h-5 w-5 text-black" />
		</button>

		<div class="flex-1 relative flex items-center justify-center min-h-0">
			{#if current}
				<img
					src={src(current, 2400)}
					alt={current.image.alt}
					class="max-w-full max-h-full object-contain"
				/>
			{/if}
			{#if albumImages.length > 1}
				<button
					type="button"
					aria-label="Previous"
					onclick={() => go(index - 1)}
					class="absolute left-4 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
				>
					<ChevronLeftIcon aria-hidden="true" class="h-5 w-5 text-black" />
				</button>
				<button
					type="button"
					aria-label="Next"
					onclick={() => go(index + 1)}
					class="absolute right-4 p-2 rounded-full bg-white/60 backdrop-blur-2xl"
				>
					<ChevronRightIcon aria-hidden="true" class="h-5 w-5 text-black" />
				</button>
			{/if}
		</div>

		{#if current?.image.caption}
			<p class="text-center text-white text-sm px-4 py-2">{current.image.caption}</p>
		{/if}

		{#if albumImages.length > 1}
			<div class="flex gap-4 overflow-x-auto p-4">
				{#each albumImages as photo, i (photo.image.storage_key)}
					<button
						type="button"
						onclick={() => go(i)}
						aria-label="Photo {i + 1}"
						aria-current={i === index}
						class="shrink-0 w-24 h-20 overflow-hidden border-3 {i === index
							? 'border-zinc-600'
							: 'border-transparent'}"
					>
						<img
							src={src(photo, 240)}
							alt={photo.image.alt}
							loading="lazy"
							class="w-full h-full object-contain"
						/>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

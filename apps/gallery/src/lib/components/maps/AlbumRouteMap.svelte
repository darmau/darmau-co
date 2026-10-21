<script lang="ts">
	import { page } from '$app/state';
	import { pad } from '$lib/format';
	import { fitBounds } from '$lib/geo';
	import { fmt } from '$lib/i18n';
	import type { Photo } from '$lib/types';

	let { photos, token }: { photos: Photo[]; token: string } = $props();

	const t = $derived(page.data.t);

	// 底图是 Mapbox 静态图，路线和编号点由 SVG / 链接叠在上面，位置按同一套 Mercator 换算，
	// 不加载 Mapbox GL（那是 500KB+ 的 JS，会让手机主线程卡一秒多）
	const W = 640;
	const H = 480;

	// 有坐标的照片，按拍摄时间排成路线；没有拍摄时间的按相册顺序排在最后
	const stops = $derived(
		photos
			.filter((p) => p.coord)
			.toSorted((a, b) => (a.takenAt ?? '￿').localeCompare(b.takenAt ?? '￿') || a.index - b.index)
	);

	const view = $derived(
		stops.length ? fitBounds(stops.map((p) => p.coord!), W, H, { padding: 56, maxZoom: 13 }) : null
	);

	const points = $derived(
		view ? stops.map((p) => ({ photo: p, xy: view.toPixel(p.coord!.lng, p.coord!.lat) })) : []
	);

	const src = $derived(
		view &&
			`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${view.lng.toFixed(6)},${view.lat.toFixed(6)},${view.zoom},0/${W}x${H}@2x` +
				`?access_token=${token}&logo=false&attribution=false`
	);
</script>

{#if view}
	<figure class="route" aria-label={t.album.route}>
		<!-- 不懒加载：桌面端它在首屏，而且常常是页面上最大的元素 -->
		{#if token}<img {src} width={W} height={H} alt="" decoding="async" />{/if}
		{#if points.length > 1}
			<svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
				<polyline points={points.map(({ xy }) => xy.map((n) => n.toFixed(1)).join(',')).join(' ')} />
			</svg>
		{/if}
		<!-- 同一地点连拍多张时编号会叠在一起，按拍摄顺序后来的盖在上面 -->
		{#each points as { photo, xy } (photo.id)}
			<a
				class="stop mono"
				href={`#photo-${photo.index}`}
				style:left={`${(xy[0] / W) * 100}%`}
				style:top={`${(xy[1] / H) * 100}%`}
				aria-label={`${pad(photo.index)} · ${fmt(t.viewer.photoN, { n: photo.index })}`}>{pad(photo.index)}</a
			>
		{/each}
		<!-- 静态图关掉了内置署名，按 Mapbox 条款自己补上 -->
		<figcaption>© Mapbox © OpenStreetMap</figcaption>
	</figure>
{/if}

<style>
	.route {
		position: relative;
		margin: 0;
		aspect-ratio: 640 / 480;
		background: var(--surface);
		border: 1px solid var(--line);
		overflow: hidden;
	}

	img,
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	polyline {
		fill: none;
		stroke: #c9c5bc;
		stroke-opacity: 0.75;
		stroke-width: 1.4;
		stroke-dasharray: 4 5;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.stop {
		position: absolute;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin: -12px 0 0 -12px;
		border-radius: 50%;
		background: var(--accent);
		border: 1.5px solid var(--bg);
		color: var(--bg);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0;
		transition: transform 0.2s var(--ease);
	}

	.stop:hover,
	.stop:focus-visible {
		z-index: 1;
		transform: scale(1.2);
	}

	figcaption {
		position: absolute;
		right: 6px;
		bottom: 4px;
		font-size: 10px;
		color: var(--muted);
	}
</style>

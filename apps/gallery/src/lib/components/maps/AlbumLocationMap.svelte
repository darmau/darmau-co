<script lang="ts">
	import { page } from '$app/state';
	import { fitBounds } from '$lib/geo';
	import type { Photo } from '$lib/types';

	let { photos, token }: { photos: Photo[]; token: string } = $props();

	const t = $derived(page.data.t);

	// 底图是 Mapbox 静态图，拍摄地点用 SVG 圆点叠在上面，位置按同一套 Mercator 换算，
	// 不加载 Mapbox GL（那是 500KB+ 的 JS，会让手机主线程卡一秒多）
	const W = 640;
	const H = 480;

	const coords = $derived(photos.map((p) => p.coord).filter((c) => c !== null));

	const view = $derived(coords.length ? fitBounds(coords, W, H, { padding: 48, maxZoom: 13 }) : null);

	// 同一地点连拍的几张会落在同一处，重叠的只画一个点
	const dots = $derived.by(() => {
		if (!view) return [];
		const out: [number, number][] = [];
		for (const c of coords) {
			const xy = view.toPixel(c.lng, c.lat);
			if (!out.some((d) => Math.hypot(d[0] - xy[0], d[1] - xy[1]) < 4)) out.push(xy);
		}
		return out;
	});

	const src = $derived(
		view &&
			`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${view.lng.toFixed(6)},${view.lat.toFixed(6)},${view.zoom},0/${W}x${H}@2x` +
				`?access_token=${token}&logo=false&attribution=false`
	);
</script>

{#if view}
	<figure class="locations" aria-label={t.album.route}>
		<!-- 不懒加载：桌面端它在首屏，而且常常是页面上最大的元素 -->
		{#if token}<img {src} width={W} height={H} alt="" decoding="async" />{/if}
		<svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
			{#each dots as [x, y], i (i)}
				<circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="6" />
			{/each}
		</svg>
		<!-- 静态图关掉了内置署名，按 Mapbox 条款自己补上 -->
		<figcaption>© Mapbox © OpenStreetMap</figcaption>
	</figure>
{/if}

<style>
	.locations {
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

	circle {
		fill: var(--accent);
		stroke: var(--bg);
		stroke-width: 2;
	}

	figcaption {
		position: absolute;
		right: 6px;
		bottom: 4px;
		font-size: 10px;
		color: var(--muted);
	}
</style>

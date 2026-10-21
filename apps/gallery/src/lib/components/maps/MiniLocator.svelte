<script lang="ts">
	import type { Coord } from '$lib/types';

	let { coord, token }: { coord: Coord; token: string } = $props();

	// 查看器里每翻一张就要换一次位置，用 Static Images API 出一张图，
	// 比再起一个 GL 地图实例轻得多。准星和标记点用 CSS 叠在正中。
	const W = 300;
	const H = 180;
	const src = $derived(
		`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${coord.lng.toFixed(5)},${coord.lat.toFixed(5)},13,0/${W}x${H}@2x` +
			`?access_token=${token}&logo=false&attribution=false`
	);
</script>

<figure class="locator">
	{#if token}
		<img {src} width={W} height={H} alt="" loading="lazy" decoding="async" />
	{/if}
	<span class="crosshair" aria-hidden="true"></span>
	<span class="marker" aria-hidden="true"></span>
	<!-- 静态图关掉了内置署名，按 Mapbox 条款自己补上 -->
	<figcaption>© Mapbox © OpenStreetMap</figcaption>
</figure>

<style>
	.locator {
		position: relative;
		margin: 0;
		aspect-ratio: 300 / 180;
		background: var(--surface);
		border: 1px solid var(--line);
		overflow: hidden;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* 十字准星：两条贯穿全图的细线 */
	.crosshair::before,
	.crosshair::after {
		content: '';
		position: absolute;
		background: rgb(232 163 61 / 0.45);
	}

	.crosshair::before {
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
	}

	.crosshair::after {
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
	}

	.marker {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 10px;
		height: 10px;
		margin: -5px 0 0 -5px;
		background: var(--accent);
		border: 2px solid var(--viewer-bg);
		border-radius: 50%;
	}

	figcaption {
		position: absolute;
		right: 4px;
		bottom: 2px;
		font-size: 9px;
		color: var(--muted);
	}
</style>

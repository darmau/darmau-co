<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Map as MapboxMap } from 'mapbox-gl';
	import { localize, type Lang } from '$lib/i18n';
	import { ACCENT, applyLanguage, loadMapbox, tintDarkStyle, whenVisible } from './mapbox';

	interface Point {
		slug: string;
		lat: number;
		lng: number;
	}

	let { points, token }: { points: Point[]; token: string } = $props();

	const lang = $derived(page.data.lang as Lang);
	let container: HTMLDivElement;

	$effect(() => {
		if (!token || !points.length) return;

		let map: MapboxMap | null = null;
		let cancelled = false;

		const stop = whenVisible(container, async () => {
			const mapboxgl = await loadMapbox(token);
			if (cancelled) return;

			const bounds = new mapboxgl.LngLatBounds();
			for (const p of points) bounds.extend([p.lng, p.lat]);

			map = new mapboxgl.Map({
				container,
				style: 'mapbox://styles/mapbox/dark-v11',
				// 默认的 globe 投影在低缩放下四周是黑色太空，和页面底色接不上
				projection: 'mercator',
				bounds,
				fitBoundsOptions: { padding: 80, maxZoom: 9 },
				attributionControl: false,
				cooperativeGestures: true
			});
			map.addControl(new mapboxgl.AttributionControl({ compact: true }));
			map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
			await applyLanguage(map, lang);

			map.on('load', () => {
				if (!map) return;
				tintDarkStyle(map);

				map.addSource('albums', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: points.map((p) => ({
							type: 'Feature',
							geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
							properties: { slug: p.slug }
						}))
					}
				});

				map.addLayer({
					id: 'album-dots',
					type: 'circle',
					source: 'albums',
					paint: {
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 10, 6],
						'circle-color': ACCENT,
						'circle-stroke-width': 1.5,
						'circle-stroke-color': '#0C0C0B'
					}
				});

				// 只画点，不显示相册名；点击进入相册
				map.on('click', 'album-dots', (e) => {
					const slug = e.features?.[0]?.properties?.slug;
					if (typeof slug === 'string') goto(localize(lang, `/albums/${slug}`));
				});
				map.on('mouseenter', 'album-dots', () => (map!.getCanvas().style.cursor = 'pointer'));
				map.on('mouseleave', 'album-dots', () => (map!.getCanvas().style.cursor = ''));
			});
		});

		return () => {
			cancelled = true;
			stop();
			map?.remove();
		};
	});
</script>

<!-- 地图本身不可键盘操作，所有相册在上方瀑布流和 /albums 里都有真实链接 -->
<div class="map" bind:this={container}></div>

<style>
	.map {
		height: clamp(420px, 62vh, 680px);
		background: var(--surface);
		border-block: 1px solid var(--line);
	}

	.map :global(.mapboxgl-ctrl-group) {
		border-radius: 0;
		background: var(--surface);
		box-shadow: none;
		border: 1px solid var(--line);
	}

	.map :global(.mapboxgl-ctrl-group button + button) {
		border-top-color: var(--line);
	}

	.map :global(.mapboxgl-ctrl-icon) {
		filter: invert(0.9);
	}
</style>

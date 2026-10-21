<script lang="ts">
	import { page } from '$app/state';
	import type { Map as MapboxMap } from 'mapbox-gl';
	import { pad } from '$lib/format';
	import type { Lang } from '$lib/i18n';
	import type { Photo } from '$lib/types';
	import { ACCENT, applyLanguage, loadMapbox, prefersReducedMotion, tintDarkStyle, whenVisible } from './mapbox';

	let { photos, token }: { photos: Photo[]; token: string } = $props();

	const lang = $derived(page.data.lang as Lang);
	// 容器在 {#if} 里，可能不存在，所以要是响应式的
	let container = $state<HTMLDivElement>();

	// 有坐标的照片，按拍摄时间排成路线；没有拍摄时间的按相册顺序排在最后
	const stops = $derived(
		photos
			.filter((p) => p.coord)
			.toSorted((a, b) => (a.takenAt ?? '￿').localeCompare(b.takenAt ?? '￿') || a.index - b.index)
	);

	$effect(() => {
		const node = container;
		if (!token || !stops.length || !node) return;

		let map: MapboxMap | null = null;
		let cancelled = false;

		const stop = whenVisible(node, async () => {
			const mapboxgl = await loadMapbox(token);
			if (cancelled) return;

			const coords = stops.map((p) => [p.coord!.lng, p.coord!.lat] as [number, number]);
			const bounds = new mapboxgl.LngLatBounds();
			for (const c of coords) bounds.extend(c);

			map = new mapboxgl.Map({
				container: node,
				style: 'mapbox://styles/mapbox/dark-v11',
				projection: 'mercator',
				bounds,
				fitBoundsOptions: { padding: 56, maxZoom: 13 },
				attributionControl: false,
				cooperativeGestures: true
			});
			map.addControl(new mapboxgl.AttributionControl({ compact: true }));
			map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
			await applyLanguage(map, lang);

			map.on('load', () => {
				if (!map) return;
				tintDarkStyle(map);

				if (coords.length > 1) {
					map.addSource('route', {
						type: 'geojson',
						data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
					});
					map.addLayer({
						id: 'route',
						type: 'line',
						source: 'route',
						layout: { 'line-join': 'round', 'line-cap': 'round' },
						paint: { 'line-color': '#C9C5BC', 'line-opacity': 0.7, 'line-width': 1.2, 'line-dasharray': [2, 3] }
					});
				}

				map.addSource('stops', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: stops.map((p) => ({
							type: 'Feature',
							geometry: { type: 'Point', coordinates: [p.coord!.lng, p.coord!.lat] },
							properties: { index: p.index, label: pad(p.index) }
						}))
					}
				});
				map.addLayer({
					id: 'stop-dots',
					type: 'circle',
					source: 'stops',
					paint: {
						'circle-radius': 10,
						'circle-color': ACCENT,
						'circle-stroke-width': 1.5,
						'circle-stroke-color': '#0C0C0B'
					}
				});
				// 同一地点连拍多张时编号会重叠，允许重叠并让后拍的盖在上面
				map.addLayer({
					id: 'stop-labels',
					type: 'symbol',
					source: 'stops',
					layout: {
						'text-field': ['get', 'label'],
						'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
						'text-size': 10,
						'text-allow-overlap': true,
						'text-ignore-placement': true
					},
					paint: { 'text-color': '#0C0C0B' }
				});

				// 点圆点滚动到对应照片
				map.on('click', 'stop-dots', (e) => {
					const index = e.features?.[0]?.properties?.index;
					document
						.getElementById(`photo-${index}`)
						?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
				});
				map.on('mouseenter', 'stop-dots', () => (map!.getCanvas().style.cursor = 'pointer'));
				map.on('mouseleave', 'stop-dots', () => (map!.getCanvas().style.cursor = ''));
			});
		});

		return () => {
			cancelled = true;
			stop();
			map?.remove();
		};
	});
</script>

{#if stops.length}
	<div class="map" bind:this={container}></div>
{/if}

<style>
	.map {
		aspect-ratio: 4 / 3;
		background: var(--surface);
		border: 1px solid var(--line);
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

<script module lang="ts">
	export interface EXIF {
		latitude?: number | null;
		longitude?: number | null;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';

	let {
		mapboxToken,
		exifData,
		lang = 'en'
	}: {
		mapboxToken: string;
		exifData: EXIF | null;
		lang?: string;
	} = $props();

	let mapContainer: HTMLDivElement;
	let shouldLoadMap = $state(false);

	// 下面这些等价于 React 版本里的 useRef：只在事件回调里读写，不参与响应式追踪
	let mapboxgl: typeof import('mapbox-gl').default | null = null;
	let map: MapboxMap | null = null;
	let marker: MapboxMarker | null = null;
	let isMapLoaded = false;

	// 使用 Intersection Observer 延迟加载地图，直到容器进入视口
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						shouldLoadMap = true;
						observer.disconnect(); // 一旦开始加载就断开观察
					}
				});
			},
			{
				rootMargin: '50px', // 提前 50px 开始加载
				threshold: 0.01 // 只要有一点进入视口就加载
			}
		);

		observer.observe(mapContainer);

		return () => {
			observer.disconnect();
		};
	});

	// 校验并返回 [lng, lat]，无效时返回 null
	function toTarget(exif: EXIF): [number, number] | null {
		const latitude = exif.latitude;
		const longitude = exif.longitude;

		if (latitude == null || longitude == null) {
			return null;
		}

		const lat = Number(latitude);
		const lng = Number(longitude);

		if (isNaN(lat) || isNaN(lng)) {
			console.warn('Invalid GPS coordinates:', { latitude, longitude });
			return null;
		}

		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			console.warn('GPS coordinates out of range:', { lat, lng });
			return null;
		}

		return [lng, lat];
	}

	// 初始化地图（只依赖 mapboxToken 和 shouldLoadMap，不依赖 lang）
	$effect(() => {
		if (!mapboxToken || !shouldLoadMap || map) {
			return;
		}

		let cancelled = false;
		let mapInstance: MapboxMap | null = null;

		(async () => {
			// mapbox-gl 在模块顶层就访问 window，只能在浏览器端动态引入
			const mapboxModule = (await import('mapbox-gl')).default;
			const { setupMapboxLanguage } = await import('$lib/utils/mapbox');
			if (cancelled) return;

			mapboxgl = mapboxModule;
			mapboxgl.accessToken = mapboxToken;
			mapInstance = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/outdoors-v12',
				center: [104.32, 30.23],
				zoom: 2
			});

			map = mapInstance;
			isMapLoaded = false;

			// 添加语言控制插件
			setupMapboxLanguage(mapInstance, lang);

			// 监听地图加载完成事件
			mapInstance.on('load', () => {
				isMapLoaded = true;

				// 如果地图加载完成时已经有 exifData，立即应用
				if (!exifData || !mapInstance) {
					return;
				}

				const target = toTarget(exifData);
				if (!target) return;

				mapInstance.flyTo({
					center: target,
					zoom: 13
				});

				if (!marker && mapboxgl) {
					marker = new mapboxgl.Marker();
					marker.setLngLat(target); // 必须先设置位置
					marker.addTo(mapInstance); // 然后再添加到地图
				} else {
					marker?.setLngLat(target);
				}
			});
		})();

		return () => {
			cancelled = true;
			if (marker) {
				marker.remove();
				marker = null;
			}
			mapInstance?.remove();
			map = null;
			isMapLoaded = false;
		};
	});

	// 处理 exifData 变化
	$effect(() => {
		const exif = exifData;

		if (!map || !isMapLoaded || !mapboxgl) {
			return;
		}

		if (!exif) {
			return;
		}

		// 没有坐标时移除现有标记
		if (exif.latitude == null || exif.longitude == null) {
			if (marker) {
				marker.remove();
				marker = null;
			}
			return;
		}

		const target = toTarget(exif);
		if (!target) return;

		// 先移动地图
		map.flyTo({
			center: target,
			zoom: 13
		});

		// 创建或更新标记
		if (!marker) {
			marker = new mapboxgl.Marker();
			marker.setLngLat(target); // 必须先设置位置
			marker.addTo(map); // 然后再添加到地图
		} else {
			marker.setLngLat(target);
		}
	});
</script>

<div bind:this={mapContainer} style="width: 100%; height: 400px"></div>

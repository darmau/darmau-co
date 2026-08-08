<script module lang="ts">
	export interface MapImageFeature {
		type: 'Feature';
		geometry: {
			type: 'Point';
			coordinates: [number, number]; // [longitude, latitude]
		};
		properties: {
			imageId: number;
			storageKey: string;
			alt: string | null;
			caption: string | null;
			location: string | null;
			width: number;
			height: number;
			albums: Array<{
				id: number;
				slug: string;
				title: string;
				publishedAt: string;
			}>;
		};
	}

	export interface MapImageCollection {
		type: 'FeatureCollection';
		features: MapImageFeature[];
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';
	import XMark from '$icons/XMark.svelte';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import AlbumText from '$lib/locales/album';

	let {
		mapboxToken,
		imageCollection,
		imgPrefix,
		lang
	}: {
		mapboxToken: string;
		imageCollection: MapImageCollection;
		imgPrefix: string;
		lang: string;
	} = $props();

	let mapContainer: HTMLDivElement;
	let selectedImage = $state<MapImageFeature | null>(null);
	let clusterImages = $state<MapImageFeature[]>([]);
	let shouldLoadMap = $state(false);

	// 等价于 React 版本里的 useRef，不参与响应式追踪
	let map: MapboxMap | null = null;
	let hasFitToBounds = false;

	const label = $derived(getLanguageLabel(AlbumText, lang));

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

	function selectFeature(feature: MapImageFeature) {
		selectedImage = feature;
		clusterImages = [];
		// 放大到该点位
		map?.flyTo({
			center: feature.geometry.coordinates,
			zoom: 15,
			duration: 1000,
			essential: true
		});
	}

	$effect(() => {
		if (!mapboxToken || !shouldLoadMap || map) return;

		let cancelled = false;
		let mapInstance: MapboxMap | null = null;

		(async () => {
			// mapbox-gl 在模块顶层就访问 window，只能在浏览器端动态引入
			const mapboxgl = (await import('mapbox-gl')).default;
			const { setupMapboxLanguage } = await import('$lib/utils/mapbox');
			if (cancelled) return;

			mapboxgl.accessToken = mapboxToken;

			// 初始化地图
			mapInstance = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/outdoors-v12',
				center: [104.32, 30.23], // 默认中心
				zoom: 2,
				scrollZoom: false // 禁用滚轮缩放，让页面可以正常滚动
			});

			map = mapInstance;

			// 添加导航控件（缩放按钮）
			const nav = new mapboxgl.NavigationControl({
				showCompass: true, // 显示指南针
				showZoom: true // 显示缩放按钮
			});
			mapInstance.addControl(nav, 'top-left');

			// 添加语言控制插件
			setupMapboxLanguage(mapInstance, lang);

			mapInstance.on('load', () => {
				if (!mapInstance) return;

				// 添加数据源
				mapInstance.addSource('photos', {
					type: 'geojson',
					data: imageCollection,
					cluster: true,
					clusterMaxZoom: 12, // 最大聚合层级（降低，更早停止聚合）
					clusterRadius: 30 // 聚合半径（像素）- 更小让点更分散
				});

				// 添加聚合圆圈图层
				mapInstance.addLayer({
					id: 'clusters',
					type: 'circle',
					source: 'photos',
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': [
							'step',
							['get', 'point_count'],
							'#7c3aed', // 紫色
							10,
							'#6d28d9',
							30,
							'#5b21b6'
						],
						'circle-radius': [
							'step',
							['get', 'point_count'],
							14, // 小于10个点
							10,
							18, // 10-30个点
							30,
							24 // 大于30个点
						]
					}
				});

				// 添加聚合数量文字图层
				mapInstance.addLayer({
					id: 'cluster-count',
					type: 'symbol',
					source: 'photos',
					filter: ['has', 'point_count'],
					layout: {
						'text-field': '{point_count_abbreviated}',
						'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
						'text-size': 12
					},
					paint: {
						'text-color': '#ffffff'
					}
				});

				// 添加单个点图层
				mapInstance.addLayer({
					id: 'unclustered-point',
					type: 'circle',
					source: 'photos',
					filter: ['!', ['has', 'point_count']],
					paint: {
						'circle-color': '#7c3aed',
						'circle-radius': 8,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#fff'
					}
				});

				// 点击聚合时的处理：根据缩放级别决定是放大还是显示列表
				mapInstance.on('click', 'clusters', (e) => {
					if (!mapInstance) return;

					const features = mapInstance.queryRenderedFeatures(e.point, {
						layers: ['clusters']
					});

					if (!features.length) return;

					const clusterId = features[0].properties?.cluster_id as number;
					const source = mapInstance.getSource('photos') as GeoJSONSource;
					const currentZoom = mapInstance.getZoom();
					const zoomThreshold = 11; // 缩放阈值：11级（与 clusterMaxZoom 配合）

					// 如果当前缩放级别达到阈值，直接显示图片列表
					if (currentZoom >= zoomThreshold) {
						// 获取聚合中的所有图片
						source.getClusterLeaves(
							clusterId,
							Number.MAX_SAFE_INTEGER, // 获取所有图片
							0, // 偏移量
							(err, leaves) => {
								if (err || !leaves) return;

								// 从原始数据中查找对应的完整 feature
								const clusterFeatures = leaves
									.map((leaf) => {
										const imageId = leaf.properties?.imageId;
										return imageCollection.features.find(
											(f) => f.properties.imageId === imageId
										);
									})
									.filter((f): f is MapImageFeature => f !== undefined);

								clusterImages = clusterFeatures;
								selectedImage = null; // 关闭单个图片详情
							}
						);
					} else {
						// 如果缩放级别未达到阈值，继续放大到分解聚合的级别
						source.getClusterExpansionZoom(clusterId, (err, zoom) => {
							if (err || !mapInstance) return;

							const geometry = features[0].geometry;
							if (geometry.type === 'Point' && zoom !== null) {
								mapInstance.easeTo({
									center: geometry.coordinates as [number, number],
									zoom: zoom
								});
							}
						});
					}
				});

				// 点击单个点显示详情
				mapInstance.on('click', 'unclustered-point', (e) => {
					if (!e.features || !e.features[0] || !mapInstance) return;

					const clickedFeature = e.features[0];
					const imageId = clickedFeature.properties?.imageId;

					// 从原始数据中查找完整的 feature
					const fullFeature = imageCollection.features.find(
						(f) => f.properties.imageId === imageId
					);

					if (fullFeature) {
						selectedImage = fullFeature;
						clusterImages = []; // 关闭聚合列表

						// 放大到该点位，增加缩放级别以获得更好的视图
						mapInstance.flyTo({
							center: fullFeature.geometry.coordinates,
							zoom: 15, // 缩放级别：15 = 街道级别，可以看清周围环境
							duration: 1000, // 动画持续时间（毫秒）
							essential: true // 即使用户开启了"减少动画"设置也执行
						});
					}
				});

				// 鼠标悬停样式
				mapInstance.on('mouseenter', 'clusters', () => {
					if (mapInstance) mapInstance.getCanvas().style.cursor = 'pointer';
				});
				mapInstance.on('mouseleave', 'clusters', () => {
					if (mapInstance) mapInstance.getCanvas().style.cursor = '';
				});
				mapInstance.on('mouseenter', 'unclustered-point', () => {
					if (mapInstance) mapInstance.getCanvas().style.cursor = 'pointer';
				});
				mapInstance.on('mouseleave', 'unclustered-point', () => {
					if (mapInstance) mapInstance.getCanvas().style.cursor = '';
				});
			});
		})();

		return () => {
			cancelled = true;
			mapInstance?.remove();
			map = null;
			hasFitToBounds = false;
		};
	});

	// imageCollection 变化时刷新数据源。
	// 注意：`map` 和原 React 版本的 `map.current` 一样不是响应式的，所以首次挂载时
	// 地图还没建好，这个 effect 直接返回；只有 imageCollection 之后再变才会真正跑起来
	// （也就是说 fitBounds 在实际使用中不会触发，这是照抄的原有行为）。
	$effect(() => {
		const collection = imageCollection;
		const mapInstance = map;
		if (!mapInstance) return;

		const updateSource = async () => {
			const source = mapInstance.getSource('photos') as GeoJSONSource | undefined;
			if (!source) return;

			source.setData(collection);

			if (collection.features.length === 0) {
				hasFitToBounds = false;
				return;
			}

			if (!hasFitToBounds) {
				const mapboxgl = (await import('mapbox-gl')).default;
				const bounds = new mapboxgl.LngLatBounds();
				collection.features.forEach((feature) => {
					bounds.extend(feature.geometry.coordinates);
				});
				mapInstance.fitBounds(bounds, { padding: 50 });
				hasFitToBounds = true;
			}
		};

		if (!mapInstance.isStyleLoaded()) {
			mapInstance.once('load', updateSource);
			return () => {
				mapInstance.off('load', updateSource);
			};
		}

		updateSource();
	});
</script>

<div class="relative w-full max-w-7xl mx-auto h-[75vh] rounded-lg overflow-hidden shadow-lg">
	<div bind:this={mapContainer} class="w-full h-full"></div>

	<!-- 聚合图片列表面板 -->
	{#if clusterImages.length > 0}
		<div
			class="absolute top-2 md:top-4 w-[90%] md:w-96 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 max-h-[800px] overflow-y-auto bg-white rounded-lg shadow-xl z-10"
		>
			<div
				class="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10"
			>
				<h3 class="text-lg font-semibold text-zinc-800">
					{label.map_title} ({clusterImages.length})
				</h3>
				<button onclick={() => (clusterImages = [])} class="text-zinc-500 hover:text-zinc-700">
					<XMark class="h-6 w-6" />
				</button>
			</div>

			<div class="p-4 space-y-3">
				{#each clusterImages as feature (feature.properties.imageId)}
					<div
						onclick={() => selectFeature(feature)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectFeature(feature);
							}
						}}
						role="button"
						tabindex="0"
						class="cursor-pointer rounded-lg overflow-hidden bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 hover:border-violet-300"
					>
						<div class="relative aspect-4/3 overflow-hidden bg-zinc-100">
							<img
								src="{imgPrefix}/cdn-cgi/image/format=avif,width=640/{feature.properties
									.storageKey}"
								alt={feature.properties.alt || ''}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>
						<div class="p-3">
							{#if feature.properties.location}
								<p class="text-sm font-medium text-zinc-800 mb-1">
									{feature.properties.location}
								</p>
							{/if}
							{#if feature.properties.caption}
								<p class="text-xs text-zinc-600 line-clamp-2">
									{feature.properties.caption}
								</p>
							{/if}
							{#if feature.properties.albums.length > 0}
								<p class="text-xs text-zinc-500 mt-1">
									{label.albums_count}: {feature.properties.albums.length}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 图片详情面板 -->
	{#if selectedImage}
		<div
			class="absolute top-2 md:top-4 w-[90%] md:w-96 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 max-h-[500px] overflow-y-auto bg-white rounded-lg shadow-xl z-10"
		>
			<div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
				<h3 class="text-lg font-semibold text-zinc-800">
					{selectedImage.properties.location || label.map_title}
				</h3>
				<button onclick={() => (selectedImage = null)} class="text-zinc-500 hover:text-zinc-700">
					<XMark class="h-6 w-6" />
				</button>
			</div>

			<div class="p-4 space-y-4">
				<!-- 图片 -->
				<div class="relative aspect-4/3 rounded-lg overflow-hidden bg-zinc-100">
					<img
						src="{imgPrefix}/cdn-cgi/image/format=avif,width=640/{selectedImage.properties
							.storageKey}"
						alt={selectedImage.properties.alt || ''}
						class="w-full h-full object-cover"
						loading="lazy"
					/>
				</div>

				<!-- 图片说明 -->
				{#if selectedImage.properties.caption}
					<p class="text-sm text-zinc-600">
						{selectedImage.properties.caption}
					</p>
				{/if}

				<!-- 相册列表 -->
				<div class="space-y-2">
					<h4 class="text-sm font-medium text-zinc-700">
						{label.albums_count} ({selectedImage.properties.albums.length})
					</h4>
					<div class="space-y-2">
						{#each selectedImage.properties.albums as album (album.id)}
							<a
								href="/{lang}/album/{album.slug}"
								class="block p-3 rounded-md bg-zinc-50 hover:bg-zinc-100 transition-colors"
							>
								<p class="font-medium text-zinc-800">{album.title}</p>
								<p class="text-xs text-zinc-500 mt-1">
									{new Date(album.publishedAt).toLocaleDateString(lang)}
								</p>
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- 图片数量统计 -->
	<div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
		<p class="text-sm text-zinc-600">
			{label.total_photos}
			<span class="font-semibold text-violet-700">{imageCollection.features.length}</span>
			{label.photos}
		</p>
	</div>
</div>

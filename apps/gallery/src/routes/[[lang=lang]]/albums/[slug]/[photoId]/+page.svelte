<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Viewer from '$lib/components/viewer/Viewer.svelte';
	import * as f from '$lib/format';
	import { ogImageUrl } from '$lib/image';

	let { data } = $props();

	// 翻页走浅路由，load 不会重跑；当前位置由查看器回报
	// svelte-ignore state_referenced_locally
	let index = $state(data.start);
	const photo = $derived(data.album.photos[index]!);

	const description = $derived(
		photo.note ??
			[photo.place?.name, photo.takenAt && f.day(photo.takenAt), f.exifLine(photo.exif).join(' / ')]
				.filter(Boolean)
				.join(' · ')
	);
</script>

<Seo
	title={`${data.album.title} · ${f.pad(photo.index)} — ${data.t.siteName}`}
	{description}
	image={ogImageUrl(data.imgPrefix, photo.storageKey)}
	type="article"
	path={`/albums/${data.album.slug}/${photo.id}`}
/>

<h1 class="sr-only">{data.album.title} · {f.pad(photo.index)}</h1>

<Viewer
	slug={data.album.slug}
	photos={data.album.photos}
	start={data.start}
	token={data.mapboxToken}
	onchange={(i) => (index = i)}
/>

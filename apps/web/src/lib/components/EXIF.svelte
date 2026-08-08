<script module lang="ts">
	export interface EXIFProps {
		Make: string;
		Model: string;
		LensModel: string;
		FNumber: string;
		ExposureTime: string;
		ISO: string;
		FocalLength: string;
		[key: string]: string;
	}

	// 将0.00125的曝光时间转换成常用的快门速度
	function shutterSpeed(exposureTime: string) {
		if (!exposureTime) return undefined;
		const time = parseFloat(exposureTime);
		if (time >= 1) {
			// 保留整数部分
			return `${Math.round(time)}`;
		}
		const fraction = Math.round(1 / time);
		return `1/${fraction}`;
	}
</script>

<script lang="ts">
	import Aperture from '$icons/Aperture.svelte';
	import Camera from '$icons/Camera.svelte';
	import Focal from '$icons/Focal.svelte';
	import ISO from '$icons/ISO.svelte';
	import Shutter from '$icons/Shutter.svelte';
	import VideoCamera from '$icons/VideoCamera.svelte';

	let { exif }: { exif: EXIFProps } = $props();

	// 参数名原本只由图标表达，而图标是 aria-hidden 的：读屏用户只会听到
	// 「100」「35mm」这样没有上下文的数字。用 dl + sr-only 的 dt 补上名字。
	const items = $derived([
		{ icon: Camera, term: 'Camera', value: `${exif.Make ?? ''} ${exif.Model ?? ''}`.trim() },
		{ icon: Aperture, term: 'Aperture', value: exif.FNumber ? `ƒ ${exif.FNumber}` : '' },
		{ icon: Shutter, term: 'Shutter speed', value: shutterSpeed(exif.ExposureTime) ?? '' },
		{ icon: VideoCamera, term: 'Lens', value: exif.LensModel ?? '' },
		{ icon: ISO, term: 'ISO', value: exif.ISO ?? '' },
		{ icon: Focal, term: 'Focal length', value: exif.FocalLength ?? '' }
	]);
</script>

<dl class="grid grid-cols-2 md:grid-cols-3 text-sm gap-4">
	{#each items as item (item.term)}
		{#if item.value}
			<div class="flex justify-start gap-2 items-center">
				<item.icon aria-hidden="true" class="h-5 w-5" />
				<dt class="sr-only">{item.term}</dt>
				<dd>{item.value}</dd>
			</div>
		{/if}
	{/each}
</dl>

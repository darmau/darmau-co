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
</script>

<div class="grid grid-cols-2 md:grid-cols-3 text-sm gap-4">
	<div class="flex justify-start gap-2 items-center">
		<Camera class="h-5 w-5" />
		<p>{exif.Make} {exif.Model}</p>
	</div>
	<div class="flex justify-start gap-2 items-center">
		<Aperture />
		<p>ƒ {exif.FNumber}</p>
	</div>
	<div class="flex justify-start gap-2 items-center">
		<Shutter />
		<p>{shutterSpeed(exif.ExposureTime)}</p>
	</div>
	<div class="flex justify-start gap-2 items-center">
		<VideoCamera class="h-5 w-5" />
		<p>{exif.LensModel}</p>
	</div>
	<div class="flex justify-start gap-2 items-center">
		<ISO />
		<p>{exif.ISO}</p>
	</div>
	<div class="flex justify-start gap-2 items-center">
		<Focal />
		<p>{exif.FocalLength}</p>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import throttle from 'lodash/throttle';

	let scrollProgress = $state(0);

	onMount(() => {
		const updateScrollProgress = throttle(() => {
			const scrollPx = document.documentElement.scrollTop;
			const winHeightPx =
				document.documentElement.scrollHeight - document.documentElement.clientHeight;
			scrollProgress = (scrollPx / winHeightPx) * 100;
		}, 50);

		window.addEventListener('scroll', updateScrollProgress);
		updateScrollProgress(); // 初始化进度

		return () => {
			window.removeEventListener('scroll', updateScrollProgress);
			updateScrollProgress.cancel();
		};
	});
</script>

<div
	style="position: fixed; top: 0; left: 0; width: {scrollProgress}%; height: 2px; background-color: #7c3aed; z-index: 9999; transition: width 0.1s ease-in-out;"
></div>

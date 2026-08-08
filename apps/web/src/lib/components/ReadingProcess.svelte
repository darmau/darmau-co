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

<!--
  纯装饰：进度信息在滚动条上已经有了，读屏没必要再念一遍。
  层级按全站规范放在 nav(40) 之下；只有宽度是动态的，其余都交给 Tailwind。
-->
<div
	aria-hidden="true"
	class="fixed top-0 left-0 z-30 h-0.5 bg-violet-600 transition-[width] duration-100 ease-in-out"
	style="width: {scrollProgress}%"
></div>

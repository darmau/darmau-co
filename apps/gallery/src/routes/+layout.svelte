<script lang="ts">
	import '$lib/styles/global.css';
	import notoSansSc from '@fontsource-variable/noto-sans-sc/index.css?url';
	import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url';
	import { setImgPrefix } from '$lib/context';

	let { data, children } = $props();

	// 前缀在一次会话里不会变，取初始值即可
	// svelte-ignore state_referenced_locally
	setImgPrefix(data.imgPrefix);
</script>

<svelte:head>
	<!-- 首屏大标题和 Logo 用的拉丁字形，提前下载以减少换字体时的跳动 -->
	<link rel="preload" as="font" type="font/woff2" href={archivoLatin} crossorigin="anonymous" />
	<!-- 中文字体不阻塞渲染：先用系统中文字体显示，样式表下载完再切换（media 技巧，见 app.html） -->
	<link rel="stylesheet" href={notoSansSc} media="print" data-async-css />
	<noscript><link rel="stylesheet" href={notoSansSc} /></noscript>
</svelte:head>

{@render children()}

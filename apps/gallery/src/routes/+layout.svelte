<script lang="ts">
	import '$lib/styles/global.css';
	import { setImgPrefix } from '$lib/context';

	let { data, children } = $props();

	// 前缀在一次会话里不会变，取初始值即可
	// svelte-ignore state_referenced_locally
	setImgPrefix(data.imgPrefix);
</script>

{@render children()}

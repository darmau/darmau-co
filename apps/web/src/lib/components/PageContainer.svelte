<script lang="ts">
	import type { Snippet } from 'svelte';

	// 页面主容器。原先这串 class 在 13 个路由文件里被复制出 10 种略有差异的变体，
	// 宽度和上下留白全靠手抄，改一处就得改一圈。
	type Width = 'narrow' | 'default' | 'wide';

	let {
		width = 'default',
		class: className = '',
		element = 'div',
		children,
		...rest
	}: {
		width?: Width;
		class?: string;
		element?: 'div' | 'section' | 'article' | 'header';
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const WIDTHS: Record<Width, string> = {
		narrow: 'max-w-5xl',
		default: 'max-w-6xl',
		wide: 'max-w-8xl'
	};

	const base = $derived(`w-full ${WIDTHS[width]} mx-auto p-4 md:py-8 mb-8 lg:mb-16`);
</script>

<svelte:element this={element} class="{base} {className}" {...rest}>
	{@render children()}
</svelte:element>

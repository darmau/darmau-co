<script lang="ts">
	import { serializeStructuredData } from '$lib/utils/structuredData';

	// Svelte 没法在模板里直接写 script 标签，结构化数据只能靠 {@html} 注入。
	// 但源码里一旦出现字面量的脚本结束标签（哪怕是在 JS 字符串或注释里），
	// Svelte 的模板解析器和 eslint-plugin-svelte 都会把它当成脚本块的结束，
	// 于是整个文件解析失败。拆成两半拼接是唯一干净的绕法。
	// 这段脏活收在这个组件里，页面侧只写 <JsonLd data={...} />。
	const CLOSING_TAG = '<' + '/' + 'script>';

	let { data }: { data: unknown } = $props();

	const html = $derived(
		`<script type="application/ld+json">${serializeStructuredData(data)}${CLOSING_TAG}`
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 内容是本地 JSON.stringify 的产物，不是用户输入 -->
	{@html html}
</svelte:head>

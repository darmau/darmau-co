<script lang="ts">
	import { marked } from 'marked';

	// marked v5 起 headerIds / mangle 已被移除，这里只保留仍然生效的两项，行为不变
	const markdownOptions = {
		gfm: true,
		breaks: true
	} as const;

	let { content }: { content: string } = $props();

	function escapeHtml(input: string) {
		return input
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	const html = $derived.by(() => {
		const escaped = escapeHtml(content);
		const rendered = marked.parse(escaped, markdownOptions);
		return typeof rendered === 'string' ? rendered : '';
	});
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- 上游 commentContent 先转义再交给 marked 渲染 -->
<div class="comment-markdown">{@html html}</div>

<script lang="ts">
	import type { Json } from '@darmau/database';
	import type { Content } from '$components/ContentContainer.svelte';
	import ShareButton from '$components/ShareButton.svelte';

	let {
		content,
		url,
		title,
		lang
	}: { content: Json; url: string; title: string; lang: string } = $props();

	// 原来的类型守卫 isContentStructure：只认「对象且带 content 数组」
	function toContentArray(value: Json): Content[] | null {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			return null;
		}
		const inner = (value as Record<string, unknown>).content;
		return Array.isArray(inner) ? (inner as Content[]) : null;
	}

	// 将 heading 里的节点 type 为 text 的内容提取出来，拼接成完整标题
	function getHeadingText(heading: Content) {
		return heading.content
			?.filter((node) => node.type === 'text')
			.map((node) => node.text)
			.join('');
	}

	const article = $derived(content ? toContentArray(content) : null);
	const toc = $derived(article?.filter((node) => node.type === 'heading') ?? []);
</script>

{#if !content || !article}
	<div>
		<p>没有目录</p>
	</div>
{:else}
	<nav aria-label="Table of contents" class="md:w-full md:sticky md:top-24 md:h-fit space-y-6">
		<div class="flex flex-col gap-2 border-b border-gray-200 pb-6">
			{#each toc as heading, index (index)}
				{#if heading.attrs?.level === 2}
					<a
						href="#{heading.attrs?.id}"
						class="font-medium text-zinc-700 hover:text-violet-700"
					>
						{getHeadingText(heading)}
					</a>
				{:else if heading.attrs?.level === 3}
					<a href="#{heading.attrs?.id}" class="pl-2 text-zinc-600 hover:text-violet-700">
						{getHeadingText(heading)}
					</a>
				{:else if heading.attrs?.level === 4}
					<a href="#{heading.attrs?.id}" class="pl-4 text-zinc-500 hover:text-violet-700">
						{getHeadingText(heading)}
					</a>
				{/if}
			{/each}
		</div>
		<ShareButton {url} {title} {lang} contentType="article" />
	</nav>
{/if}

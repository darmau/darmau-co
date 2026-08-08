<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import CommentText from '$lib/locales/comment';
	import type { CommentProps } from '$lib/types/Comment';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import getTime from '$lib/utils/getTime';
	import MarkdownContent from '$components/MarkdownContent.svelte';
	import Username from '$components/Username.svelte';

	let {
		comment,
		onReply
	}: {
		comment: CommentProps;
		onReply: (comment: CommentProps) => void;
	} = $props();

	const ctx = getSiteContext();
	const label = $derived(getLanguageLabel(CommentText, ctx.lang));

	// 楼中楼：被回复的那条评论的摘要。旧版这里的“回复”是写死的中文，照抄。
	const replyQuote = $derived(
		comment.reply_to
			? `回复 ${comment.reply_to.is_anonymous ? comment.reply_to.name : comment.reply_to.users.name}: ${comment.reply_to.content_text.substring(0, 120)}...`
			: ''
	);
</script>

<div class="pt-8">
	<Username {comment} />

	<div class="text-sm text-zinc-500">{getTime(comment.created_at, ctx.lang)}</div>

	{#if comment.reply_to}
		<div class="mt-2">
			<p class="p-4 bg-zinc-100 text-sm text-zinc-700 mb-4">{replyQuote}</p>
		</div>
	{/if}

	<div class="my-4 text-base text-zinc-700 space-y-2">
		<MarkdownContent content={comment.content_text} />
	</div>
	<button
		type="button"
		onclick={() => onReply(comment)}
		class="text-sm text-violet-700 hover:text-violet-500"
	>
		{label.reply}
	</button>
</div>

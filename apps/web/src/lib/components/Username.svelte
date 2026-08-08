<script lang="ts">
	import CheckBadge from '$icons/CheckBadge.svelte';
	import type { CommentProps } from '$lib/types/Comment';

	let { comment }: { comment: CommentProps } = $props();
</script>

{#if comment.is_anonymous}
	<h4 class="flex items-center font-medium text-zinc-800 mb-2 hover:text-violet-700">
		{#if comment.website}
			<a
				class="text-violet-700 hover:text-violet-500"
				href={comment.website}
				target="_blank"
				rel="noreferrer"
			>
				{comment.name}
			</a>
		{:else}
			<span>{comment.name}</span>
		{/if}
	</h4>
{:else}
	<h4 class="flex items-center gap-1 font-medium text-zinc-800 mb-2">
		{#if comment.users && comment.users.website}
			<a
				class="text-violet-700 hover:text-violet-500"
				href={comment.users.website}
				target="_blank"
				rel="noreferrer"
			>
				{comment.users?.name}
			</a>
		{:else}
			<span>{comment.users?.name}</span>
		{/if}
		<!-- users.role 对 anon 已不可读（2026-08-07 列级 GRANT），
		     登录用户统一显示认证标记，不再区分管理员 -->
		<CheckBadge class="w-4 h-4 inline-block text-violet-700" />
	</h4>
{/if}

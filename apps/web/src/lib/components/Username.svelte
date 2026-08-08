<script lang="ts">
	import CheckBadge from '$icons/CheckBadge.svelte';
	import type { CommentProps } from '$lib/types/Comment';
	import { safeExternalUrl } from '$lib/utils/safeUrl';

	let { comment }: { comment: CommentProps } = $props();

	// website 是评论者自填的自由文本，数据库里没有任何协议约束。
	// 直接进 href 的话 `javascript:...` 就是存储型 XSS，所以只放行
	// http/https/mailto；其余一律降级成纯文本，不渲染链接。
	let anonymousWebsite = $derived(safeExternalUrl(comment.website));
	let userWebsite = $derived(safeExternalUrl(comment.users?.website));
</script>

{#if comment.is_anonymous}
	<!-- 评论者名字只是视觉上加粗，不构成页面结构，用 h4 会往标题大纲里塞进几十条噪音 -->
	<p class="flex items-center font-medium text-zinc-800 mb-2 hover:text-violet-700">
		{#if anonymousWebsite}
			<a
				class="text-violet-700 hover:text-violet-500"
				href={anonymousWebsite}
				target="_blank"
				rel="noreferrer"
			>
				{comment.name}
			</a>
		{:else}
			<span>{comment.name}</span>
		{/if}
	</p>
{:else}
	<p class="flex items-center gap-1 font-medium text-zinc-800 mb-2">
		{#if userWebsite}
			<a
				class="text-violet-700 hover:text-violet-500"
				href={userWebsite}
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
	</p>
{/if}

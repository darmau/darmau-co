<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Session } from '@supabase/supabase-js';
	import { Turnstile } from 'svelte-turnstile';
	import { getSiteContext } from '$lib/context';
	import CommentText from '$lib/locales/comment';
	import type { CommentProps } from '$lib/types/Comment';
	import { COMMENT_MAX_LENGTH } from '$lib/utils/commentContent';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	let {
		contentTable,
		contentId,
		session,
		replyingTo,
		onCancelReply,
		form = null
	}: {
		contentTable: string;
		contentId: number;
		session: Session | null;
		replyingTo: CommentProps | null;
		onCancelReply: () => void;
		/**
		 * `?/comment` action 的返回值。可选：旧版由路由负责渲染成功/失败提示，
		 * 所以路由如果自己渲染了就不要再传，避免出现两条一样的提示。
		 */
		form?: { success?: string | false | null; error?: string | null } | null;
	} = $props();

	const ctx = getSiteContext();
	const label = $derived(getLanguageLabel(CommentText, ctx.lang));

	// 原 React 版这里用了 `replyingTo.users!.name`：匿名评论才有 name，
	// 登录用户的 users 一定存在，照抄这个断言。
	const replyQuote = $derived(
		replyingTo
			? `${label.reply} ${replyingTo.is_anonymous ? replyingTo.name : replyingTo.users!.name}: ${replyingTo.content_text.substring(0, 100)}...`
			: ''
	);
</script>

{#if !session}
	<form
		method="POST"
		action="?/comment"
		id="comment-editor"
		class="border border-zinc-200 rounded-md"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
	>
		<input name={contentTable} type="hidden" value={contentId} />

		<div class="p-4 border-b border-zinc-200">
			<input name="reply_to" type="hidden" value={replyingTo ? replyingTo.id : ''} />

			<div class="flex gap-4">
				<!-- 这三个输入框原来只有 placeholder，读屏软件在获得焦点后拿不到稳定的名称，
					 所以补上 sr-only 的 <label>；必填靠 required/aria-required 表达，星号读屏读不出来 -->
				<div class="w-full">
					<label for="comment-name" class="sr-only">{label.name_placeholder}</label>
					<input
						id="comment-name"
						class="w-full border-0 border-b border-b-zinc-200 p-0 pb-2 text-zinc-900 placeholder:text-zinc-500 sm:text-sm sm:leading-6"
						name="name"
						type="text"
						placeholder={'*' + label.name_placeholder}
						required
						aria-required="true"
					/>
				</div>
				<div class="w-full">
					<label for="comment-email" class="sr-only">{label.email_placeholder}</label>
					<input
						id="comment-email"
						class="w-full border-0 border-b border-b-zinc-200 p-0 pb-2 text-zinc-900 placeholder:text-zinc-500 sm:text-sm sm:leading-6"
						name="email"
						type="email"
						placeholder={'*' + label.email_placeholder}
						required
						aria-required="true"
					/>
				</div>
				<div class="w-full">
					<label for="comment-website" class="sr-only">{label.website_placeholder}</label>
					<input
						id="comment-website"
						class="w-full border-0 border-b border-b-zinc-200 p-0 pb-2 text-zinc-900 placeholder:text-zinc-500 sm:text-sm sm:leading-6"
						name="website"
						type="url"
						placeholder={label.website_placeholder}
					/>
				</div>
			</div>

			<div class="mt-4">
				<!-- 原来 for="comment" 指向的是不存在的元素（表单本身才叫 comment-editor），改成指向 textarea -->
				<label for="comment-content-guest" class="sr-only">{label.comment_label}</label>
				{#if replyingTo}
					<div class="p-4 bg-zinc-100 text-sm text text-zinc-700 mb-4">
						{replyQuote}
					</div>
				{/if}
				<textarea
					id="comment-content-guest"
					rows="5"
					name="content_text"
					required
					aria-required="true"
					maxlength={COMMENT_MAX_LENGTH}
					placeholder={label.add_comment}
					class="block w-full resize-y border-0 border-b border-transparent p-0 pb-2 text-zinc-900 placeholder:text-zinc-500 focus:border-violet-600 focus:ring-0 sm:text-sm sm:leading-6"
				></textarea>
			</div>
		</div>

		<div class="flex flex-col gap-4 justify-start p-4">
			<p class="text-sm text-zinc-500">
				{label.moderation_notice}
				<a href="/{ctx.lang}/login" class="font-medium text-violet-600 hover:text-violet-500">
					{label.login}
				</a>
			</p>
			<Turnstile siteKey={ctx.turnstileSiteKey} />
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<label class="inline-flex items-center gap-2 text-sm text-zinc-600">
					<input
						type="checkbox"
						name="receive_notification"
						value="true"
						class="rounded border-zinc-300 text-violet-600 focus:ring-violet-600"
					/>
					{label.receive_notification}
				</label>
				<div class="flex items-center gap-4">
					<button
						type="submit"
						class="break-keep inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						{label.submit}
					</button>
					{#if replyingTo}
						<button type="button" onclick={onCancelReply} class="text-sm font-medium text-red-600">
							{label.cancel_reply}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</form>
{:else}
	<form
		method="POST"
		action="?/comment"
		id="comment-editor"
		class="border border-zinc-200 rounded-md"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
	>
		<input name={contentTable} type="hidden" value={contentId} />
		<input name="reply_to" type="hidden" value={replyingTo ? replyingTo.id : ''} />
		<div class="p-4 border-b border-zinc-200">
			<!-- 和上面的匿名分支互斥，但仍然用不同的 id，避免将来两个分支同时出现时冲突 -->
			<label for="comment-content-user" class="sr-only">{label.comment_label}</label>
			{#if replyingTo}
				<div class="p-4 bg-zinc-100 text-sm text text-zinc-700 mb-4">
					{replyQuote}
				</div>
			{/if}
			<textarea
				id="comment-content-user"
				rows="5"
				name="content_text"
				required
				aria-required="true"
				maxlength={COMMENT_MAX_LENGTH}
				placeholder={label.add_comment}
				class="block w-full resize-y border-0 border-b border-transparent p-2 text-zinc-900 placeholder:text-zinc-500 focus:border-violet-600 focus:ring-0 sm:text-sm sm:leading-6"
			></textarea>
		</div>

		<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
			<label class="inline-flex items-center gap-2 text-sm text-zinc-600">
				<input
					type="checkbox"
					name="receive_notification"
					value="true"
					checked
					class="rounded border-zinc-300 text-violet-600 focus:ring-violet-600"
				/>
				{label.receive_notification}
			</label>
			<div class="flex items-center gap-4 sm:justify-end">
				{#if replyingTo}
					<button type="button" onclick={onCancelReply} class="text-sm font-medium text-red-600">
						{label.cancel_reply}
					</button>
				{/if}
				<button
					type="submit"
					class="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>
					{label.submit}
				</button>
			</div>
		</div>
	</form>
{/if}

<!-- 提交走 use:enhance，不会有页面跳转，提示凭空出现。容器常驻 DOM 且带 live region 角色，
	 这样读屏软件才能在内容插入时播报成功/失败 -->
<div role="alert">
	{#if form?.error}
		<p class="mt-2 text-sm text-red-600">{form.error}</p>
	{/if}
</div>
<div role="status">
	{#if form?.success}
		<p class="mt-2 text-sm text-green-700">{form.success}</p>
	{/if}
</div>

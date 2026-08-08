<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import CheckCircleIcon from '$icons/CheckCircle.svelte';
	import ExclamationTriangleIcon from '$icons/ExclamationTriangle.svelte';
	import XCircleIcon from '$icons/XCircle.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// 原来是 useNavigation().state === 'submitting'
	let isSubmitting = $state(false);

	const handleSubmit: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			isSubmitting = false;
		};
	};
</script>

<svelte:head>
	<title>取消评论通知 - 积薪 Darmau</title>
	<meta name="description" content="取消评论回复通知订阅" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !data.valid}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<XCircleIcon class="h-12 w-12 text-red-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">无法取消订阅</h1>
			<p class="text-zinc-600 text-center mb-6">
				{data.error || '链接无效或已过期'}
			</p>
			<p class="text-sm text-zinc-500 text-center">
				如果您持续收到不需要的通知，请联系我们的支持团队。
			</p>
		</div>
	</div>
{:else if form?.success}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<CheckCircleIcon class="h-12 w-12 text-green-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">取消订阅成功</h1>
			<p class="text-zinc-600 text-center mb-6">您已成功取消该评论的回复通知。</p>
			<p class="text-sm text-zinc-500 text-center">
				如果以后想再次接收通知，您可以在发表新评论时勾选"有人回复通知我"选项。
			</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<ExclamationTriangleIcon class="h-12 w-12 text-amber-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">确认取消订阅</h1>
			<p class="text-zinc-600 text-center mb-6">您确定要取消该评论的回复通知吗？</p>
			<p class="text-sm text-zinc-500 text-center mb-8">
				取消后，当有人回复您的评论时，您将不会再收到邮件提醒。
			</p>

			{#if form?.error}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-700">{form.error}</p>
				</div>
			{/if}

			<form method="POST" use:enhance={handleSubmit}>
				<input type="hidden" name="commentId" value={data.commentId || ''} />
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isSubmitting ? '处理中...' : '确认取消订阅'}
				</button>
			</form>

			<p class="mt-4 text-xs text-zinc-500 text-center">如果您误点了此链接，请直接关闭此页面。</p>
		</div>
	</div>
{/if}

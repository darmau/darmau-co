<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConfirmText from '$lib/locales/confirm';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const lang = $derived(data.lang);
	const labels = $derived(getLanguageLabel(ConfirmText, lang));
	const needsUsername = $derived(data.needsUsername);
	const userEmail = $derived(data.userEmail);

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

<!-- 原来没有 <svelte:head>，浏览器标签页只显示 URL；登录中转页也不该被搜索引擎收录 -->
<svelte:head>
	<title>{labels.title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col justify-center px-4 py-16">
	<div class="mx-auto w-full max-w-md bg-white p-10 shadow sm:rounded-lg">
		<h1 class="text-2xl font-semibold text-zinc-900 text-center">
			{labels.title}
		</h1>

		{#if needsUsername}
			<p class="mt-4 text-sm text-zinc-600 text-center">
				{labels.new_user_description}
			</p>

			<!-- 提交走 use:enhance，报错只是就地插一段文字，容器常驻并声明 role="alert" -->
			<div role="alert">
				{#if form?.error}
					<div class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-600 text-center">
						{form.error}
					</div>
				{/if}
			</div>

			<form method="POST" class="mt-8 space-y-4" use:enhance={handleSubmit}>
				<input type="hidden" name="next" value={data.next} />
				<input type="hidden" name="lang" value={lang} />

				<div class="space-y-2">
					<label for="username" class="block text-sm font-medium text-zinc-700">
						{labels.username_label}
					</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						aria-required="true"
						placeholder={labels.username_placeholder}
						class="block w-full rounded-md border-0 p-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6"
						value={form?.values?.username ?? ''}
						disabled={isSubmitting}
					/>
					{#if userEmail}
						<p class="text-xs text-zinc-500">
							Email: {userEmail}
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="website" class="block text-sm font-medium text-zinc-700">
						{labels.website_label}
					</label>
					<input
						type="url"
						id="website"
						name="website"
						placeholder={labels.website_placeholder}
						class="block w-full rounded-md border-0 p-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6"
						value={form?.values?.website ?? ''}
						disabled={isSubmitting}
					/>
					<p class="text-xs text-zinc-500">{labels.website_hint}</p>
				</div>

				<button
					type="submit"
					class="flex w-full justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={isSubmitting}
				>
					{labels.button}
				</button>
			</form>
		{:else}
			<!-- load 只有 needs_username=true 时才会返回数据，其余情况都重定向走了，
				 所以这个分支和旧版一样是不会命中的，保留以求 1:1。 -->
			<p class="mt-4 text-sm text-zinc-600 text-center">
				{labels.description}
			</p>
		{/if}
	</div>
</div>

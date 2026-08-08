<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getSiteContext } from '$lib/context';
	import SignupText from '$lib/locales/signup';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	let {
		disabled = false,
		form = null
	}: {
		disabled?: boolean;
		/**
		 * `?/login` action 的返回值。可选：旧版由 /[lang]/login 路由渲染错误提示，
		 * 路由自己渲染了就不用传，免得出现两条一样的提示。
		 */
		form?: { success?: boolean; error?: string | null } | null;
	} = $props();

	const ctx = getSiteContext();
	const label = $derived(getLanguageLabel(SignupText, ctx.lang));

	// 原来靠 useNavigation().state === 'submitting' && formData.intent === 'email' 判断
	let submitting = $state(false);
	const isDisabled = $derived(disabled || submitting);

	const handleSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	};
</script>

<form method="POST" action="?/login" use:enhance={handleSubmit}>
	<div class="space-y-6">
		<div>
			<label for="email" class="block text-sm font-medium leading-6 text-zinc-900">
				{label.email}
			</label>
			<div class="mt-2">
				<input
					id="email"
					name="email"
					type="email"
					required
					aria-required="true"
					autocomplete="email"
					class="block w-full rounded-md border-0 p-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 disabled:opacity-50"
					placeholder="name@example.com"
					disabled={isDisabled}
				/>
			</div>
		</div>
		<input type="hidden" value={ctx.lang} name="lang" />

		<div>
			<button
				type="submit"
				name="intent"
				value="email"
				class="flex w-full justify-center rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
				disabled={isDisabled}
			>
				{label.send_link}
			</button>
		</div>
	</div>

	<!-- use:enhance 提交后没有导航，错误只是凭空多出一段文字，用 role="alert" 让读屏立即播报 -->
	<div role="alert">
		{#if form?.error}
			<div class="mt-6">
				<p class="text-sm text-red-600">{form.error}</p>
			</div>
		{/if}
	</div>
</form>

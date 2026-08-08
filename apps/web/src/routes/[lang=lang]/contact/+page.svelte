<script lang="ts">
	import { enhance } from '$app/forms';
	import Subnav from '$components/Subnav.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import { getSiteContext } from '$lib/context';
	import ContactText from '$lib/locales/contact';
	import HomepageText from '$lib/locales/homepage';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const site = getSiteContext();
	const lang = $derived(site.lang);
	const label = $derived(getLanguageLabel(ContactText, lang));
	const metaLabel = $derived(getLanguageLabel(HomepageText, lang));
	// 原来从 root loader 拿 session，这里根 layout 的数据已经并进 page data
	const session = $derived(data.session);
</script>

<svelte:head>
	<title>{metaLabel.contact_title}</title>
	<meta name="description" content={metaLabel.contact_description} />
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="contact" />

<Subnav active="about" />
<div class="max-w-md mx-auto my-8 lg:my-12 px-4 lg:p-0">
	<header class="text-center space-y-4">
		<!-- 这行小标题原来是 <h2>，排在 <h1> 前面会让标题层级倒挂，改成普通段落，样式不变 -->
		<p class="font-medium text-sm text-violet-700">{label.contact_us}</p>
		<h1 class="font-medium text-3xl text-zinc-700">{label.get_in_touch}</h1>
		<p class="text-zinc-500">{label.description}</p>
	</header>
	<form method="POST" class="space-y-6" use:enhance>
		<div class="mb-4">
			<label for="contact_type" class="block text-sm font-medium leading-6 text-zinc-900 mb-2">
				{label.contact_type}
			</label>
			<select
				id="contact_type"
				name="contact_type"
				class="block w-full rounded-md border-0 p-1.5 text-zinc-900 shadow-sm ring-1 ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:ring-zinc-200 sm:text-sm sm:leading-6"
				required
				aria-required="true"
				disabled={!session}
			>
				<option value="email">Email</option>
				<option value="telegram">Telegram</option>
				<option value="wechat">WeChat</option>
				<option value="line">Line</option>
			</select>
		</div>
		<div class="mb-4">
			<label for="contact" class="block text-sm font-medium leading-6 text-zinc-900 mb-2">
				{label.contact}
			</label>
			<input
				id="contact"
				name="contact"
				type="text"
				class="block w-full rounded-md border-0 p-1.5 text-zinc-900 shadow-sm ring-1 ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:ring-zinc-200 sm:text-sm sm:leading-6"
				required
				aria-required="true"
				disabled={!session}
			/>
		</div>
		<div class="mb-4">
			<label for="message" class="block text-sm font-medium leading-6 text-zinc-900 mb-2">
				{label.message}
			</label>
			<textarea
				id="message"
				name="message"
				rows="4"
				class="block w-full rounded-md border-0 p-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:bg-zinc-50"
				required
				aria-required="true"
				disabled={!session}
			></textarea>
		</div>
		{#if session}
			<button
				type="submit"
				class="flex w-full justify-center rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{label.submit}
			</button>
		{:else}
			<div class="flex justify-between">
				<p class="text-red-600 text-sm">{label.require_login}</p>
				<a href="/{lang}/login" class="bg-violet-600 px-3 py-2 rounded text-white font-medium">
					{label.login}
				</a>
			</div>
		{/if}
	</form>
	<!-- 走 use:enhance 提交，提交完不跳页，提示直接出现在这里。
		 容器常驻 DOM 并声明 live region 角色，读屏才会播报结果 -->
	<div role="alert">
		{#if form?.error}
			<p class="mt-4 text-red-600">{form.error}</p>
		{/if}
	</div>
	<div role="status">
		{#if form?.success}
			<p class="mt-4 text-green-700">{form.success}</p>
		{/if}
	</div>
</div>

<script lang="ts">
	import EmailLogin from '$components/EmailLogin.svelte';
	import GithubLogin from '$components/GithubLogin.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import SignupText from '$lib/locales/signup';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const lang = $derived(data.lang);
	const label = $derived(getLanguageLabel(SignupText, lang));
	const queryError = $derived(data.error === 'magic_link' ? label.magic_link_error : null);
	const errorMessage = $derived(form?.error ?? queryError);
</script>

<svelte:head>
	<title>{label.log_in_title}</title>
	<meta name="description" content={label.log_in_description} />
</svelte:head>

<I18nHead baseUrl={data.baseUrl} {lang} availableLangs={data.availableLangs} path="login" />

<div class="h-full bg-zinc-50 flex flex-col justify-center py-16 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900">
			{label.log_in_title}
		</h2>
		<p class="mt-6 text-center text-base text-zinc-500">{label.log_in_description}</p>
		<p class="mt-2 text-center text-sm text-zinc-400">{label.magic_link_hint}</p>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
		<!-- 旧版这层是 <Form method="POST">，邮箱表单和 GitHub 按钮都包在里面。
			 现在 EmailLogin 自带 <form action="?/login">，GithubLogin 是纯客户端按钮，
			 再套一层 form 会变成非法的表单嵌套，所以这里退化成一个纯样式容器。 -->
		<div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
			{#if form?.success}
				<div class="rounded-md bg-green-50 p-4 text-sm text-green-700">
					{label.email_check}
				</div>
			{:else}
				<!-- 提示由本路由渲染，所以不给组件传 form，免得出现两条一样的错误 -->
				<EmailLogin />
			{/if}

			{#if errorMessage}
				<div class="mt-6">
					<p class="text-sm text-red-600">{errorMessage}</p>
				</div>
			{/if}

			<GithubLogin />
		</div>
		<div class="mt-6 text-center text-sm text-zinc-500">
			<a href="/{lang}/terms-of-use">Terms of Use</a>
		</div>
	</div>
</div>

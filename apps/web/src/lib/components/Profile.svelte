<script lang="ts">
	// 检测当前是否有登录，没有则显示登录按钮，有则显示用户信息
	import { page } from '$app/state';
	import ProfileText from '$lib/locales/profile';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	let { lang }: { lang: string } = $props();

	const session = $derived(page.data.session);
	const label = $derived(getLanguageLabel(ProfileText, lang));
</script>

{#if !session}
	<div class="flex justify-end items-center">
		<a
			href="/{lang}/login"
			class="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
		>
			{label.login}
		</a>
	</div>
{:else}
	<div class="flex gap-4 justify-end items-center">
		<a href="/{lang}/profile/{session.user.id}" class="lg:py-0 flex flex-col items-end">
			<h3 class="text-sm font-medium text-zinc-700">{session.user.user_metadata.name}</h3>
			<p class="text-xs text-zinc-400">{session.user.user_metadata.email}</p>
		</a>
	</div>
{/if}

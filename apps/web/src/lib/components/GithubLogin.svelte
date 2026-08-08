<script lang="ts">
	import { page } from '$app/state';
	import { getSiteContext } from '$lib/context';
	import SignupText from '$lib/locales/signup';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	const ctx = getSiteContext();
	const label = $derived(getLanguageLabel(SignupText, ctx.lang));

	// 旧版是把 intent=github 提交给路由 action，由服务端 supabase 换 OAuth URL 再 302。
	// SvelteKit 这边直接用浏览器端 supabase 客户端发起，回调地址不变。
	let submitting = $state(false);
	let error = $state<string | null>(null);

	async function signInWithGithub() {
		if (submitting) {
			return;
		}
		submitting = true;
		error = null;

		const next = page.url.searchParams.get('next') ?? `/${ctx.lang}`;
		const { data, error: oauthError } = await ctx.supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${page.url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
				skipBrowserRedirect: true
			}
		});

		if (oauthError) {
			console.error(oauthError);
			error = oauthError.message;
			submitting = false;
			return;
		}

		if (data.url) {
			window.location.href = data.url;
			return;
		}

		submitting = false;
	}
</script>

<div>
	<div class="relative mt-10">
		<div aria-hidden="true" class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-zinc-200"></div>
		</div>
		<div class="relative flex justify-center text-sm font-medium leading-6">
			<span class="bg-white px-6 text-zinc-900">{label.oauth}</span>
		</div>
	</div>
	<div class="mt-6">
		<button
			type="button"
			onclick={signInWithGithub}
			disabled={submitting}
			class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
		>
			<svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" class="h-5 w-5 fill-[#24292F]">
				<path
					d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
					clip-rule="evenodd"
					fill-rule="evenodd"
				/>
			</svg>
			<span class="text-sm font-semibold leading-6">GitHub</span>
		</button>
	</div>
	<!-- OAuth 失败只会就地渲染一段文字，容器常驻并带 role="alert"，读屏才能感知 -->
	<div role="alert">
		{#if error}
			<div class="mt-6">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	</div>
</div>

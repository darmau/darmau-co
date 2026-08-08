<script lang="ts">
	import { page } from '$app/state';
	import ConfirmText from '$lib/locales/confirm';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';

	const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
	type SupportedLang = (typeof SUPPORTED_LANGS)[number];

	function deriveLang(input?: string | null): SupportedLang {
		if (!input) {
			return 'zh';
		}
		try {
			const url = new URL(input, 'http://placeholder');
			const segments = url.pathname.split('/').filter(Boolean);
			const candidate = segments[0];
			if (candidate && SUPPORTED_LANGS.includes(candidate as SupportedLang)) {
				return candidate as SupportedLang;
			}
		} catch {
			const segments = input.split('/').filter(Boolean);
			const candidate = segments[0];
			if (candidate && SUPPORTED_LANGS.includes(candidate as SupportedLang)) {
				return candidate as SupportedLang;
			}
		}
		return 'zh';
	}

	// 原版的 loader 只是把 next/reason/lang 三个查询参数读出来，没有任何服务端依赖，
	// 所以这里不需要 +page.server.ts，直接从 page.url 读。
	const next = $derived(page.url.searchParams.get('next') ?? '/');
	const reason = $derived(page.url.searchParams.get('reason') ?? 'unknown');
	const providedLang = $derived(page.url.searchParams.get('lang'));
	const lang = $derived(
		providedLang && SUPPORTED_LANGS.includes(providedLang as SupportedLang)
			? (providedLang as SupportedLang)
			: deriveLang(next)
	);
	const labels = $derived(getLanguageLabel(ConfirmText, lang));
	const loginPath = $derived(`/${lang}/login`);
</script>

<div class="min-h-screen bg-zinc-50 flex flex-col justify-center px-4 py-16">
	<div class="mx-auto w-full max-w-md bg-white p-10 shadow sm:rounded-lg">
		<h1 class="text-2xl font-semibold text-zinc-900 text-center">{labels.title}</h1>
		<p class="mt-4 text-sm text-zinc-600 text-center">{labels.invalid}</p>
		{#if reason !== 'unknown'}
			<p class="mt-2 text-xs text-zinc-400 text-center break-words">
				{reason}
			</p>
		{/if}
		<div class="mt-8 space-y-3">
			<a
				href={loginPath}
				class="block w-full text-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{labels.back_to_login}
			</a>
		</div>
	</div>
</div>

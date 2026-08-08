<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { navigating } from '$app/state';
	import '../app.css';
	import Banners from '$components/Banners.svelte';
	import Footer from '$components/Footer.svelte';
	import Navbar from '$components/Navbar.svelte';
	import JsonLd from '$components/JsonLd.svelte';
	import PendingNavigation from '$components/PendingNavigation.svelte';
	import { setSiteContext } from '$lib/context';
	import { generateWebsiteStructuredData } from '$lib/utils/structuredData';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const SITE_NAMES: Record<string, string> = { zh: '积薪', en: 'Firewood', jp: '積薪' };

	const siteName = $derived(SITE_NAMES[data.lang] ?? '积薪');

	const websiteJsonLd = $derived(
		generateWebsiteStructuredData({
			baseUrl: data.baseUrl,
			name: siteName,
			alternateName: ['积薪', 'Firewood', '積薪', 'darmau.co'].filter((n) => n !== siteName),
			inLanguage: data.lang
		})
	);

	// 用 getter 而不是快照：导航切换语言/页面后 data 会变，context 消费方要跟着更新
	setSiteContext({
		get supabase() {
			return data.supabase;
		},
		get lang() {
			return data.lang;
		},
		get prefix() {
			return data.env.PREFIX;
		},
		get turnstileSiteKey() {
			return data.env.TURNSTILE_SITE_KEY;
		}
	});

	$effect(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, newSession) => {
			// 服务端和客户端的 session 不一致时重新拉一遍 layout 数据
			if (event !== 'INITIAL_SESSION' && newSession?.access_token !== data.session?.access_token) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<meta property="og:site_name" content={siteName} />
	<meta name="application-name" content={siteName} />
</svelte:head>

<JsonLd data={websiteJsonLd} />

<Navbar lang={data.lang} items={data.navbarItems} />
<PendingNavigation />
<main class="flex-1 w-full mt-[76px] {navigating.to ? 'opacity-30' : ''}">
	<Banners lang={data.lang} />
	{@render children()}
</main>
<Footer lang={data.lang} currentYear={data.currentYear} items={data.footerItems} />

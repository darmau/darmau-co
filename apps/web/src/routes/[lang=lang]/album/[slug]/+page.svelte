<script lang="ts">
	import type { Json } from '@darmau/database';
	import { untrack } from 'svelte';
	import { page as pageState } from '$app/state';
	import Breadcrumb, { type BreadcrumbProps } from '$components/Breadcrumb.svelte';
	import CommentBlock from '$components/CommentBlock.svelte';
	import CommentEditor from '$components/CommentEditor.svelte';
	import ContentContainer from '$components/ContentContainer.svelte';
	import GallerySlide, { type AlbumPhoto } from '$components/GallerySlide.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import JsonLd from '$components/JsonLd.svelte';
	// 旧版用 React.lazy + Suspense；Mapbox 组件自己已经在 onMount 里动态 import mapbox-gl。
	import Mapbox from '$components/Mapbox.svelte';
	import Reaction, { type ReactionSummary } from '$components/Reaction.svelte';
	import ShareButton from '$components/ShareButton.svelte';
	import EyeSolid from '$icons/EyeSolid.svelte';
	import MapPin from '$icons/MapPin.svelte';
	import { getSiteContext } from '$lib/context';
	import type { CommentProps } from '$lib/types/Comment';
	import AlbumText from '$locales/album';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import getTime from '$utils/getTime';
	import { trackPageView } from '$utils/trackPageView';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(AlbumText, site.lang));
	const session = $derived(pageState.data.session);

	let currentIndex = $state(0);

	const breadcrumbPages: BreadcrumbProps[] = $derived([
		{
			name: label.latest_albums,
			to: `albums/all/1`,
			current: false
		},
		{
			name: data.albumContent.title!,
			to: `album/${data.albumContent.slug}`,
			current: true
		}
	]);

	// 存储被回复评论的id
	let replyingTo = $state<CommentProps | null>(null);

	const handleReply = (comment: CommentProps) => {
		replyingTo = comment;
		document.getElementById('comment-editor')?.scrollIntoView({ behavior: 'smooth' });
	};

	const handleCancelReply = () => {
		replyingTo = null;
	};

	// 阅读量计算
	let pageView = $state(untrack(() => data.albumContent.page_view));
	$effect(() => {
		trackPageView('album', data.albumContent.id, site.supabase, (newPageView) => {
			pageView = newPageView;
		}).catch((err) => {
			console.error(err);
		});
	});

	const description = $derived(data.albumContent.abstract ?? data.albumContent.content_text ?? '');
	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/${data.albumImages![0].image.storage_key}`
	);
</script>

<svelte:head>
	<title>{data.albumContent.title}</title>
	<meta name="description" content={description} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{site.lang}/album/rss.xml"
	/>
	<meta property="og:title" content={data.albumContent.title} />
	<meta
		property="og:url"
		content="{data.baseUrl}/{site.lang}/album/{data.albumContent.slug}"
	/>
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={description} />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:title" content={data.albumContent.title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<!-- 结构化数据 -->
<JsonLd data={data.structuredData.album} />
<JsonLd data={data.structuredData.breadcrumb} />
{#each data.structuredData.comments as comment, index (index)}
	<JsonLd data={comment} />
{/each}

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="album/{data.albumContent.slug}"
/>

<div class="w-full max-w-8xl mx-auto p-4 md:py-8 lg:mb-16">
	<Breadcrumb pages={breadcrumbPages} />
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="col-span-1 lg:col-span-2 lg:self-start">
			<GallerySlide
				albumImages={data.albumImages as unknown as AlbumPhoto[]}
				onIndexChange={(i) => (currentIndex = i)}
				albumTitle={data.albumContent.title!}
			/>
		</div>

		<div class="col-span-1 lg:row-span-2 space-y-4">
			<!-- 分类只是装饰性的 eyebrow，原来用 h2 会让标题顺序变成 h2 → h1 -->
			<p class="text-sm text-violet-700 font-medium">{data.albumContent.category!.title}</p>
			<h1 class="text-zinc-800 font-medium text-3xl">{data.albumContent.title}</h1>
			<p class="text-zinc-600 text-sm">{getTime(data.albumContent.published_at!, site.lang)}</p>
			<div class="flex gap-1 items-center justify-start">
				<EyeSolid class="h-4 w-4 inline-block text-zinc-500" />
				<p class="text-zinc-500 text-sm">{pageView}</p>
			</div>

			<ContentContainer content={data.albumContent.content_json as Json} />
			{#if data.albumContent.topic}
				<ol class="flex gap-2 flex-wrap">
					{#each data.albumContent.topic as topic, index (index)}
						<li class="text-sm text-zinc-600">#{topic}</li>
					{/each}
				</ol>
			{/if}

			<Reaction
				contentType="photo"
				contentId={data.albumContent.id}
				reactions={data.albumContent.reactions as ReactionSummary | null}
			/>

			<div class="flex gap-2 justify-start items-center">
				<MapPin class="w-6 h-6 text-violet-700 inline-block" />
				<p class="text-sm text-zinc-500">{data.albumImages![currentIndex].image.location}</p>
			</div>
			{#if data.albumImages && data.albumImages[currentIndex]}
				<Mapbox
					mapboxToken={data.MAPBOX}
					exifData={{
						latitude: data.albumImages[currentIndex].image.latitude ?? null,
						longitude: data.albumImages[currentIndex].image.longitude ?? null
					}}
					lang={site.lang}
				/>
			{/if}
			<ShareButton
				url="{data.baseUrl}{pageState.url.pathname}"
				title={data.albumContent.title!}
				lang={site.lang}
				contentType="album"
			/>
		</div>
		<div class="col-span-1 lg:col-span-2 lg:self-start">
			<CommentEditor
				contentTable="to_photo"
				contentId={data.albumContent.id}
				{session}
				{replyingTo}
				onCancelReply={handleCancelReply}
			/>
			<!-- live region 要常驻 DOM 才会被读屏播报，所以容器无条件渲染 -->
			<div role="alert" class="empty:hidden">
				{#if form?.error}
					<p class="mt-2 text-sm text-red-600">{form.error}</p>
				{/if}
			</div>
			<div role="status" class="empty:hidden">
				{#if form?.success}
					<p class="mt-2 text-sm text-green-700">{form.success}</p>
				{/if}
			</div>
			<div class="flex flex-col gap-4 divide-y divide-none">
				{#each data.comments as comment (comment.id)}
					<CommentBlock comment={comment as unknown as CommentProps} onReply={handleReply} />
				{/each}
			</div>
			<div class="py-8 flex justify-between">
				{#if data.page > 1}
					<a
						href="?page={data.page - 1}&limit={data.limit}#comment-editor"
						class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						{label.previous}
					</a>
				{/if}
				{#if data.page < data.totalPage}
					<a
						href="?page={data.page + 1}&limit={data.limit}#comment-editor"
						class="ml-auto rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						{label.next}
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import type { Json } from '@darmau/database';
	import { untrack } from 'svelte';
	import { page as pageState } from '$app/state';
	import Breadcrumb, { type BreadcrumbProps } from '$components/Breadcrumb.svelte';
	import CommentBlock from '$components/CommentBlock.svelte';
	import CommentEditor from '$components/CommentEditor.svelte';
	import ContentContainer from '$components/ContentContainer.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import JsonLd from '$components/JsonLd.svelte';
	import PageContainer from '$components/PageContainer.svelte';
	import Reaction, { type ReactionSummary } from '$components/Reaction.svelte';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import EyeSolid from '$icons/EyeSolid.svelte';
	import { getSiteContext } from '$lib/context';
	import type { CommentProps } from '$lib/types/Comment';
	import type { Image } from '$lib/types/Image';
	import ThoughtText from '$locales/thought';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import getTime from '$utils/getTime';
	import { trackPageView } from '$utils/trackPageView';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(ThoughtText, site.lang));
	const session = $derived(pageState.data.session);

	const breadcrumbPages: BreadcrumbProps[] = $derived([
		{
			name: label.all_thoughts,
			to: `thoughts`,
			current: false
		},
		{
			name: data.thoughtData.content_text ? `${data.thoughtData.content_text.slice(0, 10)}...` : '',
			to: `thought/${data.thoughtData.slug}`,
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
	let pageView = $state(untrack(() => data.thoughtData.page_view));
	$effect(() => {
		trackPageView('thought', data.thoughtData.id, site.supabase, (newPageView) => {
			pageView = newPageView;
		}).catch((err) => {
			console.error(err);
		});
	});

	const title = $derived(getTime(data.thoughtData.created_at!, site.lang));
	const description = $derived(
		data.thoughtData.content_text ? data.thoughtData.content_text.split(/\r?\n/).join('') : ''
	);
	// 详情页的 h1 原来写着「Thoughts」（和列表页对调了），读屏用户拿不到任何关于这条想法的信息。
	// 这里用想法本身的摘要，没有正文时退回发布时间。
	const heading = $derived(
		description ? `${description.slice(0, 40)}${description.length > 40 ? '…' : ''}` : title
	);
	// 旧版登录用户评论成功时 success 是布尔 true，React 把它渲染成空；这里保持一致
	const successMessage = $derived(typeof form?.success === 'string' ? form.success : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:type" content="article" />
	<meta
		property="og:url"
		content="{data.baseUrl}/{site.lang}/thought/{data.thoughtData.slug}"
	/>
	<meta property="og:description" content={description} />
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:creator" content="@darmau8964" />
</svelte:head>

<!-- 结构化数据 -->
<JsonLd data={data.structuredData.thought} />
<JsonLd data={data.structuredData.breadcrumb} />
{#each data.structuredData.comments as comment, index (index)}
	<JsonLd data={comment} />
{/each}

<I18nHead
	baseUrl={data.baseUrl}
	lang={site.lang}
	availableLangs={data.availableLangs}
	path="thought/{data.thoughtData.slug}"
/>

<PageContainer>
	<Breadcrumb pages={breadcrumbPages} />
	<h1 class="sr-only">{heading}</h1>
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="col-span-1 lg:col-span-2">
			<ContentContainer content={data.thoughtData.content_json as unknown as Json} />
			{#if data.thoughtImages}
				<div class="space-y-2">
					{#each data.thoughtImages as image (image.image.id)}
						<!--
							ResponsiveImage 防 CLS 靠调用方在 classList 里传 aspect-*，
							但想法配图比例不固定，没法用固定的 aspect-* class，
							这里用原图宽高直接把盒子的比例定死，避免图片加载完成时页面跳动。
						-->
						<div style="aspect-ratio: {image.image.width} / {image.image.height}">
							<ResponsiveImage
								image={image.image as Image}
								width={560}
								classList="rounded w-full h-full"
							/>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex justify-start items-center gap-1 mt-4">
				<div class="flex gap-1 items-center justify-start">
					<EyeSolid class="h-4 w-4 inline-block text-zinc-500" />
					<p class="text-zinc-500 text-sm">{pageView}</p>
				</div>
				·
				<p class="text-sm text-zinc-500">{getTime(data.thoughtData.created_at!, site.lang)}</p>
			</div>
			<Reaction
				contentType="thought"
				contentId={data.thoughtData.id}
				reactions={data.thoughtData.reactions as ReactionSummary | null}
				class="mt-6"
			/>
		</div>

		<div class="col-span-1 space-y-4">
			<CommentEditor
				contentTable="to_thought"
				contentId={data.thoughtData.id}
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
					<p class="mt-2 text-sm text-green-700">{successMessage}</p>
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
</PageContainer>

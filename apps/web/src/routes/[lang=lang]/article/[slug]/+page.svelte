<script lang="ts" module>
	import type { Json } from '@darmau/database';

	// 以下这一整套 TipTap JSON → 纯 HTML 的渲染逻辑原样搬自
	// app/routes/$lang.article.$slug.tsx，只给会员文章的隐藏降级内容用。
	type TipTapMark = {
		type?: string;
		attrs?: Record<string, unknown>;
	};

	type TipTapNode = {
		type?: string;
		text?: string | null;
		content?: TipTapNode[];
		attrs?: {
			level?: number;
			id?: string | number;
			start?: number;
			href?: string;
			target?: string;
			rel?: string;
			language?: string;
			alt?: string | null;
		} & Record<string, unknown>;
		marks?: TipTapMark[];
	};

	type TipTapDoc = {
		type?: string;
		content?: TipTapNode[];
	};

	const renderPlainArticleHtml = (content: Json | null | undefined): string => {
		if (!content || typeof content !== 'object') {
			return '';
		}

		const documentNode = content as TipTapDoc;
		if (!Array.isArray(documentNode.content) || documentNode.content.length === 0) {
			return '';
		}

		const body = documentNode.content.map(renderTipTapNode).join('');

		return body ? `<article>${body}</article>` : '';
	};

	const renderTipTapNode = (node?: TipTapNode): string => {
		if (!node || typeof node.type !== 'string') {
			return '';
		}

		switch (node.type) {
			case 'doc':
				return renderChildren(node.content);
			case 'text':
				return applyMarks(escapeHtml(node.text ?? ''), node.marks);
			case 'hardBreak':
				return '<br />';
			case 'paragraph':
				return `<p>${renderChildren(node.content)}</p>`;
			case 'heading': {
				const level = getHeadingLevel(node.attrs?.level);
				return `<h${level}>${renderChildren(node.content)}</h${level}>`;
			}
			case 'blockquote':
				return `<blockquote>${renderChildren(node.content)}</blockquote>`;
			case 'bulletList':
				return `<ul>${renderChildren(node.content)}</ul>`;
			case 'orderedList': {
				const start =
					typeof node.attrs?.start === 'number' && node.attrs.start > 1
						? ` start="${node.attrs.start}"`
						: '';
				return `<ol${start}>${renderChildren(node.content)}</ol>`;
			}
			case 'listItem':
				return `<li>${renderChildren(node.content)}</li>`;
			case 'codeBlock':
			case 'customCodeBlock': {
				const language =
					typeof node.attrs?.language === 'string' && node.attrs.language.trim()
						? ` class="language-${escapeAttr(node.attrs.language.trim())}"`
						: '';
				const code = escapeHtml(getTextContent(node.content));
				return `<pre><code${language}>${code}</code></pre>`;
			}
			case 'horizontalRule':
				return '<hr />';
			case 'table':
				return `<table>${renderChildren(node.content)}</table>`;
			case 'tableRow':
				return `<tr>${renderChildren(node.content)}</tr>`;
			case 'tableHeader':
				return `<th>${renderChildren(node.content)}</th>`;
			case 'tableCell':
				return `<td>${renderChildren(node.content)}</td>`;
			case 'image': {
				const altText = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
				return altText ? `<p>${escapeHtml(altText)}</p>` : '';
			}
			default:
				return renderChildren(node.content);
		}
	};

	const renderChildren = (children?: TipTapNode[]): string => {
		if (!Array.isArray(children) || children.length === 0) {
			return '';
		}

		return children.map(renderTipTapNode).join('');
	};

	const applyMarks = (text: string, marks?: TipTapMark[]): string => {
		if (!text || !Array.isArray(marks) || marks.length === 0) {
			return text;
		}

		return marks.reduce((acc, mark) => {
			switch (mark.type) {
				case 'bold':
					return `<strong>${acc}</strong>`;
				case 'italic':
					return `<em>${acc}</em>`;
				case 'strike':
					return `<del>${acc}</del>`;
				case 'code':
					return `<code>${acc}</code>`;
				case 'highlight':
					return `<mark>${acc}</mark>`;
				case 'link': {
					const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#';
					const targetAttr =
						typeof mark.attrs?.target === 'string'
							? ` target="${escapeAttr(mark.attrs.target)}"`
							: '';
					const relAttr =
						typeof mark.attrs?.rel === 'string' ? ` rel="${escapeAttr(mark.attrs.rel)}"` : '';
					return `<a href="${escapeAttr(href)}"${targetAttr}${relAttr}>${acc}</a>`;
				}
				default:
					return acc;
			}
		}, text);
	};

	const getHeadingLevel = (level?: number): number => {
		if (typeof level !== 'number') {
			return 2;
		}
		if (level < 1) {
			return 1;
		}
		if (level > 6) {
			return 6;
		}
		return Math.round(level);
	};

	const getTextContent = (children?: TipTapNode[]): string => {
		if (!Array.isArray(children) || children.length === 0) {
			return '';
		}

		return children
			.map((child) => {
				if (!child || typeof child !== 'object') {
					return '';
				}
				if (child.type === 'text') {
					return child.text ?? '';
				}
				if (child.type === 'hardBreak') {
					return '\n';
				}
				return getTextContent(child.content);
			})
			.join('');
	};

	const HTML_ESCAPE_REGEX = /[&<>"'`]/g;
	const HTML_ESCAPE_MAP: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'`': '&#96;'
	};

	const escapeHtml = (value: string): string => {
		return value.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] ?? char);
	};

	const escapeAttr = (value: string): string => {
		return escapeHtml(value);
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { page as pageState } from '$app/state';
	import Breadcrumb, { type BreadcrumbProps } from '$components/Breadcrumb.svelte';
	import Catalog from '$components/Catalog.svelte';
	import CommentBlock from '$components/CommentBlock.svelte';
	import CommentEditor from '$components/CommentEditor.svelte';
	import ContentContainer from '$components/ContentContainer.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import NextAndPrev, { type NeighboringPost } from '$components/NextAndPrev.svelte';
	import Reaction, { type ReactionSummary } from '$components/Reaction.svelte';
	import ReadingProcess from '$components/ReadingProcess.svelte';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import EyeIcon from '$icons/EyeSolid.svelte';
	import LockClosedIcon from '$icons/LockClosedSolid.svelte';
	import { getSiteContext } from '$lib/context';
	import ArticleText from '$lib/locales/article';
	import type { CommentProps } from '$lib/types/Comment';
	import type { Image } from '$lib/types/Image';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import getTime from '$lib/utils/getTime';
	import JsonLd from '$components/JsonLd.svelte';
	import { trackPageView } from '$lib/utils/trackPageView';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const site = getSiteContext();
	const lang = $derived(site.lang);
	const session = $derived(data.session);
	const article = $derived(data.article);

	const label = $derived(getLanguageLabel(ArticleText, lang));
	const pathname = $derived(pageState.url.pathname);
	const isPremiumArticle = $derived(article.is_premium === true);
	const canViewContent = $derived(!isPremiumArticle || !!session);
	const plainArticleHtml = $derived(
		renderPlainArticleHtml(article.content_json as Json | null | undefined)
	);

	// 原来这里还有一次 `if (!article) throw new Response(null, {status: 404})`。
	// load 里已经用 error(404, 'Article not exists') 拦过，走到组件时 article 必然存在，
	// 这段在 SvelteKit 里是死代码，删除。

	const breadcrumbPages: BreadcrumbProps[] = $derived([
		{
			name: label.latest_articles,
			to: `articles/1`,
			current: false
		},
		{
			name: article.title!,
			to: `article/${article.slug}`,
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

	// 阅读量计算。原 useState(article.page_view) 只取首屏快照，后续由下面的 rpc 回调更新，
	// 用 untrack 保持同样的语义。
	let pageView = $state(untrack(() => data.article.page_view));
	$effect(() => {
		const id = article.id;
		const supabase = site.supabase;
		trackPageView('article', id, supabase, (newPageView) => {
			pageView = newPageView;
		}).catch((err) => {
			console.error(err);
		});
	});

	const ogImage = $derived(
		`${data.prefix}/cdn-cgi/image/format=jpeg,width=960/${article.cover?.storage_key ?? 'a2b148a3-5799-4be0-a8d4-907f9355f20f'}`
	);
</script>

<svelte:head>
	<title>{article.title}</title>
	<meta name="description" content={article.abstract ?? article.subtitle ?? ''} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="RSS"
		href="{data.baseUrl}/{lang}/article/rss.xml"
	/>
	<meta property="og:title" content={article.title ?? ''} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{data.baseUrl}/{lang}/article/{article.slug}" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:description" content={article.subtitle ?? ''} />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:title" content={article.title ?? ''} />
	<meta property="twitter:description" content={article.subtitle ?? ''} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:creator" content="@darmau8964" />

</svelte:head>

<!-- 结构化数据 -->
<JsonLd data={data.structuredData.article} />
<JsonLd data={data.structuredData.breadcrumb} />
{#each data.structuredData.comments as comment, index (index)}
	<JsonLd data={comment} />
{/each}

<I18nHead
	baseUrl={data.baseUrl}
	{lang}
	availableLangs={data.availableLangs}
	path="article/{article.slug}"
/>

<div class="w-full max-w-6xl mx-auto p-4 md:py-8 mb-8 lg:mb-16">
	<ReadingProcess />
	<Breadcrumb pages={breadcrumbPages} />
	<div class="flex flex-col gap-8 md:gap-16">
		<div class="grid grid-cols-1 md:grid-cols-2 grid-rows-1 mt-4 gap-6 md:gap-8">
			<header class="space-y-4">
				<div class="flex gap-4 flex-wrap justify-start items-center">
					<h3 class="text-sm text-violet-700 font-medium">{article.category!.title}</h3>
					<time class="text-zinc-600 text-sm">{getTime(article.published_at!, lang)}</time>
				</div>
				<div class="flex items-center gap-3 text-zinc-800">
					<h1 class="font-medium leading-normal text-4xl lg:text-5xl">{article.title}</h1>
				</div>
				<h2 class="text-zinc-600 text-lg lg:text-xl">{article.subtitle}</h2>
				{#if article.abstract}
					<p class="p-4 rounded-md bg-zinc-100 text-zinc-600 leading-normal text-sm lg:text-base">
						{article.abstract}
					</p>
				{/if}
				{#if article.topic}
					<ol class="flex gap-2 flex-wrap">
						{#each article.topic as topic, index (index)}
							<li class="text-sm text-zinc-600">#{topic}</li>
						{/each}
					</ol>
				{/if}
				<div class="flex gap-1 items-center justify-start">
					<EyeIcon class="h-4 w-4 inline-block text-zinc-500" />
					<p class="text-zinc-500 text-sm">{pageView}</p>
				</div>
			</header>
			{#if article.cover}
				<ResponsiveImage
					image={article.cover as unknown as Image}
					width={960}
					classList="w-full rounded-md overflow-hiden object-cover aspect-3/2"
				/>
			{/if}
		</div>

		<!--正文-->
		<div
			class="relative grid grid-cols-1 {canViewContent
				? 'md:grid-cols-3'
				: 'md:grid-cols-2'} md:gap-24"
		>
			<div class="col-span-1 md:col-span-2 selection:bg-violet-800/60 selection:text-white">
				<div class="flex flex-col">
					{#if canViewContent}
						{#if article.content_json}
							<ContentContainer content={article.content_json as Json} />
						{/if}
					{:else}
						<div class="relative overflow-hidden rounded-lg border border-violet-200 bg-white/80 p-4 md:p-6">
							<div class="pointer-events-none select-none blur-sm" aria-hidden="true">
								<div class="space-y-3 text-left text-lg font-semibold leading-8 text-gray-300">
									<p>
										我们认为下面这些真理是不证自明的：人人生而平等，造物主赋予他们若干不可剥夺的权利，其中包括生命权、自由权和追求幸福的权利。为了保障这些权利，人们才在他们之间建立政府，而政府之正当权力，则来自被统治者的同意。任何形式的政府，只要破坏上述目的，人民就有权利改变或废除它，并建立新政府；新政府赖以奠基的原则，得以组织权力的方式，都要最大可能地增进民众的安全和幸福。的确，从慎重考虑，不应当由于轻微和短暂的原因而改变成立多年的政府。过去的一切经验也都说明，任何苦难，只要尚能忍受，人类都宁愿容忍，而无意废除他们久已习惯了的政府来恢复自身的权益。但是，当政府一贯滥用职权、强取豪夺，一成不变地追逐这一目标，足以证明它旨在把人民置于绝对专制统治之下时，那么，人民就有权利，也有义务推翻这个政府，并为他们未来的安全建立新的保障。
									</p>
								</div>
							</div>
							<div
								class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg px-6 py-8 text-center"
							>
								<LockClosedIcon class="h-10 w-10 text-violet-600" />
								<p class="text-base text-zinc-600 md:text-lg">{label.premium_content_locked}</p>
								<a
									href="/{lang}/login"
									class="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
								>
									{label.login_to_read}
								</a>
							</div>
						</div>
						{#if plainArticleHtml}
							<div aria-hidden="true" style="display: none">{@html plainArticleHtml}</div>
						{/if}
					{/if}
					<Reaction
						contentType="article"
						contentId={article.id}
						reactions={article.reactions as ReactionSummary | null}
						class="mt-10"
					/>
					<NextAndPrev
						type="article"
						next={data.nextArticle as NeighboringPost}
						prev={data.previousArticle as NeighboringPost}
					/>
					<div class="mt-16 col-span-1 lg:col-span-2">
						<CommentEditor
							contentTable={'to_article'}
							contentId={article.id}
							{session}
							{replyingTo}
							onCancelReply={handleCancelReply}
						/>
						<div class="flex flex-col gap-4 divide-y divide-none">
							{#if form?.error}
								<p class="mt-2 text-sm text-red-500">{form.error}</p>
							{/if}
							{#if form?.success}
								<p class="mt-2 text-sm text-green-500">{form.success}</p>
							{/if}
							{#each data.comments as comment (comment.id)}
								<CommentBlock comment={comment as unknown as CommentProps} onReply={handleReply} />
							{/each}
						</div>
						<div class="py-8 flex justify-between">
							{#if data.page > 1}
								<a
									href="?page={data.page - 1}&limit={data.limit}#comment-editor"
									class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								>{label.previous}</a>
							{/if}
							{#if data.page < data.totalPage}
								<a
									href="?page={data.page + 1}&limit={data.limit}#comment-editor"
									class="ml-auto rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								>{label.next}</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
			{#if canViewContent && article.content_json}
				<aside class="hidden md:flex md:col-span-1 md:h-full">
					<Catalog
						content={article.content_json as Json}
						url="{data.domain}{pathname}"
						title={article.title!}
						{lang}
					/>
				</aside>
			{/if}
		</div>
	</div>
</div>

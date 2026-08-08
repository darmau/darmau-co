<script module lang="ts">
	import type { Json } from '@darmau/database';

	/**
	 * 原来定义在 app/routes/$lang.thoughts.tsx 里（`export interface Thought`）。
	 * 该路由还没移植，暂时随组件导出，路由移植完可以按需搬去 $lib/types。
	 */
	export interface Thought {
		id: number;
		slug: string;
		content_json: Json;
		content_text: string;
		created_at: string;
		page_view: number;
		comments: { count: number }[];
		thought_image: {
			image: {
				id: number;
				alt: string | null;
				storage_key: string;
				width: number;
				height: number;
			};
		}[];
	}
</script>

<script lang="ts">
	import ContentContainer from '$components/ContentContainer.svelte';
	import ResponsiveImage from '$components/ResponsiveImage.svelte';
	import getTime from '$utils/getTime';
	import { getSiteContext } from '$lib/context';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import ThoughtText from '$locales/thought';
	import { trackTranslate } from '$utils/zaraz';
	import ChatBubbleOvalLeft from '$icons/ChatBubbleOvalLeft.svelte';
	import EyeSolid from '$icons/EyeSolid.svelte';

	// Thought 是数据库行的形状，id 由父组件当 each key 用，本组件模板里用不到
	// eslint-disable-next-line svelte/no-unused-props
	let { thought }: { thought: Thought } = $props();

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(ThoughtText, site.lang));

	// 原版用 useFetcher 往 /api/translate 提交；SvelteKit 这边直接 fetch 那个资源路由。
	let translatedText = $state<string | null>(null);
	let showTranslation = $state(false);
	let errorMessage = $state<string | null>(null);
	let isTranslating = $state(false);

	const canTranslate = $derived(
		['en', 'jp'].includes(site.lang) && thought.content_text.trim().length > 0
	);

	const buttonLabel = $derived.by(() => {
		if (!translatedText) {
			return isTranslating ? label.translating : label.translate;
		}
		return showTranslation ? label.show_original : label.show_translation;
	});

	async function handleTranslateClick() {
		if (!canTranslate) {
			return;
		}

		// 记录每次翻译按钮点击
		trackTranslate();

		if (translatedText) {
			showTranslation = !showTranslation;
			return;
		}

		const formData = new FormData();
		formData.append('text', thought.content_text);
		formData.append('targetLang', site.lang);

		isTranslating = true;
		try {
			const response = await fetch('/api/translate', { method: 'POST', body: formData });
			const data = (await response.json()) as { translation?: string; error?: string };
			if (data.translation) {
				translatedText = data.translation;
				showTranslation = true;
				errorMessage = null;
			} else if (data.error) {
				errorMessage = data.error;
			}
		} catch {
			// 原版由 react-router 的 ErrorBoundary 兜底；这里就地降级成一条错误提示
			errorMessage = label.translation_error;
		} finally {
			isTranslating = false;
		}
	}
</script>

<div class="break-inside-avoid mb-4">
	<a
		href="/{site.lang}/thought/{thought.slug}"
		class="block cursor-pointer relative rounded-2xl bg-white px-6 py-2 shadow-xl border border-gray-200 overflow-hidden shadow-zinc-500/10 hover:shadow-zinc-500/30 hover:shadow-2xl transition-all duration-300"
	>
		<svg aria-hidden="true" width="105" height="78" class="absolute left-6 top-6 fill-slate-100">
			<path
				d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z"
			></path>
		</svg>
		<div class="relative mb-4 space-y-4">
			<ContentContainer content={thought.content_json} />
			<div class="flex gap-3 justify-start items-center">
				<div class="flex gap-1 items-center">
					<EyeSolid class="h-4 w-4 inline-block text-zinc-400" />
					<span class="text-zinc-500 text-sm">{thought.page_view}</span>
				</div>
				<div class="flex gap-1 items-center">
					<ChatBubbleOvalLeft class="h-4 w-4 inline-block text-zinc-400" />
					<span class="text-zinc-500 text-sm">{thought.comments[0].count}</span>
				</div>
				<p class="text-sm text-zinc-500">{getTime(thought.created_at, site.lang)}</p>
			</div>
			{#if thought.thought_image && thought.thought_image.length > 0}
				<div class="grid grid-cols-3 gap-4">
					{#each thought.thought_image as image (image.image.id)}
						<ResponsiveImage
							image={image.image}
							width={160}
							classList="aspect-square rounded"
						/>
					{/each}
				</div>
			{/if}
		</div>
	</a>

	{#if canTranslate}
		<div class="mt-3 space-y-2">
			<button
				type="button"
				onclick={handleTranslateClick}
				disabled={isTranslating && !translatedText}
				class="text-sm font-medium text-violet-700 hover:text-violet-900 disabled:text-zinc-400"
			>
				{buttonLabel}
			</button>

			{#if errorMessage}
				<p class="text-sm text-red-500">{errorMessage || label.translation_error}</p>
			{/if}

			{#if showTranslation && translatedText}
				<div
					class="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-zinc-700 whitespace-pre-line"
				>
					{translatedText}
				</div>
			{/if}
		</div>
	{/if}
</div>

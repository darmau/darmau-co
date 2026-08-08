<script lang="ts" module>
	import { SvelteSet } from 'svelte/reactivity';

	export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'think';

	export type ReactionCounts = Record<ReactionType, number>;
	export type ReactionSummary = Partial<ReactionCounts>;

	type ReactionConfig = { key: ReactionType; emoji: string; label: string };

	const REACTION_CONFIG: ReactionConfig[] = [
		{ key: 'like', emoji: '👍', label: 'Like' },
		{ key: 'love', emoji: '❤️', label: 'Love' },
		{ key: 'haha', emoji: '😂', label: 'Haha' },
		{ key: 'wow', emoji: '😮', label: 'Wow' },
		{ key: 'sad', emoji: '😢', label: 'Sad' },
		{ key: 'think', emoji: '🤔', label: 'Think' }
	];

	const STORAGE_PREFIX = 'reaction_';
	const STORAGE_TTL = 1000 * 60 * 60 * 24 * 14; // 14 days

	const normalizeCounts = (value: unknown, fallback: ReactionCounts): ReactionCounts => {
		if (!value || typeof value !== 'object') {
			return fallback;
		}

		const record = value as Record<string, unknown>;
		return REACTION_CONFIG.reduce<ReactionCounts>((acc, item) => {
			const raw = record[item.key];
			acc[item.key] = typeof raw === 'number' ? raw : fallback[item.key];
			return acc;
		}, { ...fallback });
	};

	const getStorageKey = (pathname: string, reaction: ReactionType) => {
		return `${STORAGE_PREFIX}${pathname}_${reaction}`;
	};

	const readStoredReactions = (pathname: string): SvelteSet<ReactionType> => {
		if (typeof window === 'undefined') {
			return new SvelteSet();
		}

		const now = Date.now();
		const selected = new SvelteSet<ReactionType>();

		REACTION_CONFIG.forEach(({ key }) => {
			const itemKey = getStorageKey(pathname, key);
			const raw = window.localStorage.getItem(itemKey);

			if (!raw) {
				return;
			}

			const timestamp = Number(raw);
			if (Number.isFinite(timestamp) && now - timestamp < STORAGE_TTL) {
				selected.add(key);
			} else {
				window.localStorage.removeItem(itemKey);
			}
		});

		return selected;
	};

	const storeReaction = (pathname: string, reaction: ReactionType) => {
		if (typeof window === 'undefined') {
			return;
		}
		window.localStorage.setItem(getStorageKey(pathname, reaction), String(Date.now()));
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { getSiteContext } from '$lib/context';

	let {
		contentType,
		contentId,
		reactions = null,
		// 原 React 版把 className 解构出来后从没用过（外面传的 "mt-10" 一直没生效），
		// 这里照抄这个行为：接收但不应用，免得改变现有排版。
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		class: className = ''
	}: {
		contentType: 'article' | 'photo' | 'thought';
		contentId: number;
		reactions?: ReactionSummary | null;
		class?: string;
	} = $props();

	const ctx = getSiteContext();
	const pathname = $derived(page.url.pathname);

	// 原 useState 的惰性初始值：只取 props 的首次快照，后续由下面的 $effect 同步
	let counts = $state<ReactionCounts>(
		untrack(() => ({
			like: reactions?.like ?? 0,
			love: reactions?.love ?? 0,
			haha: reactions?.haha ?? 0,
			wow: reactions?.wow ?? 0,
			sad: reactions?.sad ?? 0,
			think: reactions?.think ?? 0
		}))
	);
	// SvelteSet 自身可响应，不用再包 $state；原 React 版的「换一个新 Set」在这里改成原地更新
	const active = new SvelteSet<ReactionType>();
	let pending = $state<ReactionType | null>(null);
	let error = $state<string | null>(null);

	// 原 useEffect([pathname])
	$effect(() => {
		const current = pathname;
		untrack(() => {
			const stored = readStoredReactions(current);
			active.clear();
			for (const key of stored) {
				active.add(key);
			}
		});
	});

	// 原 useEffect([reactions])：props 变了就按 props 覆盖，props 没给的保留旧值
	$effect(() => {
		const next = reactions;
		untrack(() => {
			counts = {
				like: next?.like ?? counts.like ?? 0,
				love: next?.love ?? counts.love ?? 0,
				haha: next?.haha ?? counts.haha ?? 0,
				wow: next?.wow ?? counts.wow ?? 0,
				sad: next?.sad ?? counts.sad ?? 0,
				think: next?.think ?? counts.think ?? 0
			};
		});
	});

	async function handleReaction(reaction: ReactionType) {
		if (pending || active.has(reaction)) {
			return;
		}

		pending = reaction;
		error = null;

		const fallback = {
			...counts,
			[reaction]: (counts[reaction] ?? 0) + 1
		} as ReactionCounts;

		const { data, error: rpcError } = await ctx.supabase.rpc('add_reaction', {
			content_type: contentType,
			content_id: contentId,
			reaction_type: reaction
		});

		if (rpcError) {
			console.error(rpcError);
			error = '提交失败，请稍后重试。';
			pending = null;
			return;
		}

		counts = normalizeCounts(data, fallback);

		active.add(reaction);
		storeReaction(pathname, reaction);

		pending = null;
	}
</script>

<div class="my-4 rounded-xl flex flex-col gap-2">
	<div class="flex flex-wrap gap-2">
		{#each REACTION_CONFIG as { key, emoji } (key)}
			{@const isActive = active.has(key)}
			{@const isLoading = pending === key}
			<button
				type="button"
				aria-pressed={isActive}
				disabled={isLoading}
				onclick={() => handleReaction(key)}
				class="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition
              {isActive
					? 'border-violet-600 bg-violet-50 text-violet-700 shadow-inner'
					: 'border-zinc-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700'}
              {isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}"
			>
				<span class="text-lg" aria-hidden="true">{emoji}</span>
				<span class="text-xs text-zinc-500">· {counts[key] ?? 0}</span>
			</button>
		{/each}
	</div>
	{#if error}
		<p class="text-xs text-red-500 px-1">{error}</p>
	{/if}
</div>

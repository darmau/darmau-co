<script lang="ts">
	// 接收一个正整数，返回一个包含 5 个星星的元素，其中前 n 个星星为实心，后面的星星为空心。
	// 例如，如果传入 3，则返回的元素为：★★★☆☆ 实心用实心 StarIcon，空心用描边 StarIcon

	import Star from '$icons/Star.svelte';
	import StarSolid from '$icons/StarSolid.svelte';

	let { n }: { n: number | null } = $props();

	const solid = $derived(n === null ? [] : [...Array(n).keys()]);
	const outline = $derived(n === null ? [] : [...Array(5 - n).keys()]);
</script>

{#snippet outlineStar()}
	<Star class="w-4 h-4 text-zinc-500" />
{/snippet}

<!-- 单颗星的 svg 自带 aria-hidden，整组靠 role="img" + aria-label 报出「几分（满分 5）」。
     评分是纯数字，不随语言变化，所以不走文案表 -->
{#if n === null}
	<div class="flex gap-1" role="img" aria-label="—/5">
		{@render outlineStar()}
		{@render outlineStar()}
		{@render outlineStar()}
		{@render outlineStar()}
		{@render outlineStar()}
	</div>
{:else}
	<div class="flex gap-1" role="img" aria-label="{n}/5">
		{#each solid as i (i)}
			<StarSolid class="w-4 h-4 text-yellow-500" />
		{/each}
		{#each outline as i (i)}
			{@render outlineStar()}
		{/each}
	</div>
{/if}

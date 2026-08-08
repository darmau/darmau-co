<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import CheckCircleIcon from '$icons/CheckCircle.svelte';
	import ExclamationTriangleIcon from '$icons/ExclamationTriangle.svelte';
	import XCircleIcon from '$icons/XCircle.svelte';
	import I18nHead from '$components/I18nHead.svelte';
	import UnsubscribeText from '$lib/locales/unsubscribe';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const lang = $derived(data.lang);
	const labels = $derived(getLanguageLabel(UnsubscribeText, lang));

	// 原来是 useNavigation().state === 'submitting'
	let isSubmitting = $state(false);
	const submissionSuccess = $derived(form?.success === true);

	const handleSubmit: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			isSubmitting = false;
		};
	};
</script>

<svelte:head>
	<title>{labels.title}</title>
	<meta name="description" content={labels.description} />
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:title" content={labels.title} />
	<meta property="og:description" content={labels.description} />
	{#if data.baseUrl}
		<meta property="og:url" content="{data.baseUrl}/{lang}/unsubscribe" />
	{/if}
</svelte:head>

{#if data.baseUrl}
	<I18nHead
		baseUrl={data.baseUrl}
		{lang}
		availableLangs={data.availableLangs}
		path="unsubscribe"
	/>
{/if}

{#if data.state === 'error'}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<XCircleIcon class="h-12 w-12 text-red-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">
				{labels.error_title}
			</h1>
			<p class="text-zinc-600 text-center">
				{data.message ?? labels.error_generic}
			</p>
		</div>
	</div>
{:else if submissionSuccess}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<CheckCircleIcon class="h-12 w-12 text-green-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">
				{labels.success_title}
			</h1>
			<p class="text-zinc-600 text-center mb-6">{labels.success_description}</p>
			<a
				href="/{lang}"
				class="w-full inline-flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
			>
				{labels.home_button}
			</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
			<div class="flex items-center justify-center mb-4">
				<ExclamationTriangleIcon class="h-12 w-12 text-amber-500" />
			</div>
			<h1 class="text-2xl font-bold text-zinc-900 text-center mb-4">
				{labels.confirm_title}
			</h1>
			<p class="text-zinc-600 text-center mb-8">
				{labels.confirm_description}
			</p>

			{#if form?.error}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-700">{form.error}</p>
				</div>
			{/if}

			<form method="POST" use:enhance={handleSubmit}>
				<input type="hidden" name="token" value={data.token || ''} />
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isSubmitting ? labels.pending : labels.confirm_button}
				</button>
			</form>
		</div>
	</div>
{/if}

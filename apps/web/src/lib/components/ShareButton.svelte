<script lang="ts">
	import TwitterIcon from '$icons/Twitter.svelte';
	import CopyIcon from '$icons/Copy.svelte';
	import getLanguageLabel from '$utils/getLanguageLabel';
	import Text from '$locales/utils';
	import { trackCopyLink, trackShareX, type ContentType } from '$utils/zaraz';

	interface ShareButtonProps {
		url: string;
		title: string;
		lang: string;
		contentType: ContentType;
	}

	let { url, title, lang, contentType }: ShareButtonProps = $props();

	const label = $derived(getLanguageLabel(Text, lang));

	let showMessage = $state(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(url);
			trackCopyLink(title, contentType);
			showMessage = true;
			setTimeout(() => {
				showMessage = false;
			}, 3000);
		} catch (err) {
			console.error('复制失败:', err);
		}
	};

	const handleShareX = () => {
		trackShareX(title, contentType);
	};

	const encodeUrl = $derived(encodeURIComponent(url));
	const encodeTitle = $derived(encodeURIComponent(title));
	const twitterUrl = $derived(
		`https://x.com/intent/tweet?text=${encodeTitle}&url=${encodeUrl}&via=darmau8964`
	);
</script>

<div class="flex justify-start gap-3 items-center">
	<button
		onclick={copyToClipboard}
		class="group flex gap-2 border border-gray-200 rounded-md shadow-sm p-2 justify-between"
	>
		<CopyIcon class="h-5 w-5 group-hover:text-zinc-900" />
		<span
			class="text-sm group-hover:font-medium {showMessage ? 'text-green-600' : 'text-zinc-700'}"
		>
			{showMessage ? label.coppied : label.copy_link}
		</span>
	</button>
	<a
		class="twitter-share-button border border-gray-200 rounded-md shadow-sm p-2 group"
		href={twitterUrl}
		target="_blank"
		rel="noopener noreferrer"
		onclick={handleShareX}
	>
		<TwitterIcon class="h-5 w-5 text-zinc-600 group-hover:text-zinc-900" />
	</a>
</div>

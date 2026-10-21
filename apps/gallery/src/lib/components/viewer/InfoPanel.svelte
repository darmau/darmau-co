<script lang="ts">
	import { page } from '$app/state';
	import * as f from '$lib/format';
	import type { Photo } from '$lib/types';
	import MiniLocator from '../maps/MiniLocator.svelte';

	let { photo, total, token }: { photo: Photo; total: number; token: string } = $props();

	const t = $derived(page.data.t);
	const exif = $derived(photo.exif);

	const cells = $derived(
		[
			[t.exif.focal, f.focal(exif)],
			[t.exif.aperture, f.aperture(exif.aperture)],
			[t.exif.shutter, f.shutter(exif.exposureTime)],
			[t.exif.iso, exif.iso === null ? null : String(exif.iso)]
		] as [string, string | null][]
	);
	const hasExif = $derived(cells.some(([, v]) => v) || !!exif.camera);

	const osm = $derived(
		photo.coord &&
			`https://www.openstreetmap.org/?mlat=${photo.coord.lat.toFixed(6)}&mlon=${photo.coord.lng.toFixed(6)}#map=16/${photo.coord.lat.toFixed(5)}/${photo.coord.lng.toFixed(5)}`
	);
</script>

<div class="panel">
	<header class="block">
		<p class="index mono"><span class="accent">{f.pad(photo.index)}</span> <span class="of">/ {f.pad(total)}</span></p>
		{#if photo.takenAt}
			<p class="taken">
				<span class="label">{t.viewer.taken}</span>
				<time class="mono" datetime={photo.takenAt}>{f.fullDateTime(photo.takenAt)}</time>
			</p>
		{/if}
		{#if photo.note}<p class="note">{photo.note}</p>{/if}
	</header>

	<section class="block" aria-label={t.viewer.params}>
		{#if hasExif}
			<dl class="grid">
				{#each cells as [term, value] (term)}
					<div>
						<dt class="label">{term}</dt>
						<dd class="big mono">{value ?? '—'}</dd>
					</div>
				{/each}
			</dl>
			<dl class="rows">
				{#if exif.camera}<div><dt class="label">{t.exif.camera}</dt><dd>{exif.camera}</dd></div>{/if}
				{#if exif.lens}<div><dt class="label">{t.exif.lens}</dt><dd class="mono small">{exif.lens}</dd></div>{/if}
				{#if f.ev(exif.exposureComp)}<div><dt class="label">{t.viewer.ev}</dt><dd class="mono">{f.ev(exif.exposureComp)}</dd></div>{/if}
				<div><dt class="label">{t.exif.size}</dt><dd class="mono">{photo.width} × {photo.height}</dd></div>
			</dl>
		{:else}
			<p class="empty">{t.viewer.noExif}</p>
		{/if}
	</section>

	{#if photo.coord}
		<section class="block" aria-label={t.viewer.location}>
			<MiniLocator coord={photo.coord} {token} />
			{#if photo.place}
				<p class="place">{photo.place.name}</p>
				{#if photo.place.region}<p class="region">{photo.place.region}</p>{/if}
			{/if}
			{#if photo.address}<p class="address">{photo.address}</p>{/if}
			<dl class="rows">
				<div><dt class="label">{t.viewer.lat}</dt><dd class="mono">{f.lat(photo.coord.lat, 6)}</dd></div>
				<div><dt class="label">{t.viewer.lng}</dt><dd class="mono">{f.lng(photo.coord.lng, 6)}</dd></div>
				{#if photo.coord.alt !== null}
					<div><dt class="label">{t.viewer.alt}</dt><dd class="mono">{f.meters(photo.coord.alt)}</dd></div>
				{/if}
			</dl>
			<a class="osm" href={osm} target="_blank" rel="noopener">{t.viewer.openMap} <span aria-hidden="true">↗</span></a>
		</section>
	{/if}
</div>

<style>
	.panel {
		display: grid;
		align-content: start;
	}

	.block {
		display: grid;
		gap: 12px;
		padding: 24px;
		border-bottom: 1px solid var(--line);
	}

	.index {
		font-size: 28px;
		line-height: 1;
	}

	.of {
		font-size: 14px;
		color: var(--muted);
	}

	.taken {
		display: grid;
		gap: 4px;
		font-size: 13px;
	}

	.note {
		color: var(--text-2);
		font-size: 14px;
	}

	dl {
		margin: 0;
	}

	dd {
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-top: 1px solid var(--line);
		border-left: 1px solid var(--line);
	}

	.grid > div {
		display: grid;
		gap: 6px;
		padding: 12px;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}

	.big {
		font-size: 22px;
		line-height: 1.1;
	}

	.rows {
		display: grid;
	}

	.rows > div {
		display: grid;
		grid-template-columns: 88px 1fr;
		gap: 12px;
		align-items: baseline;
		padding: 6px 0;
		font-size: 13px;
	}

	.small {
		font-size: 12px;
		color: var(--text-2);
	}

	.empty {
		color: var(--muted);
		font-size: 13px;
	}

	.place {
		font-size: 18px;
		font-weight: 600;
		line-height: 1.2;
	}

	.region,
	.address {
		font-size: 12px;
		color: var(--muted);
	}

	.osm {
		justify-self: start;
		font-size: 13px;
		color: var(--text-2);
		border-bottom: 1px solid var(--line);
	}

	.osm:hover {
		color: var(--text);
		border-bottom-color: var(--text-2);
	}
</style>

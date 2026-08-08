<script lang="ts">
	import { getSiteContext } from '$lib/context';
	import HomepageText from '$locales/homepage';
	import getLanguageLabel from '$utils/getLanguageLabel';

	const site = getSiteContext();
	const label = $derived(getLanguageLabel(HomepageText, site.lang));
</script>

<div class="bg-white py-16 sm:py-24">
	<div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
		<div
			class="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32"
		>
			<h2
				class="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
			>
				{label.cta_title}
			</h2>
			<p class="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-gray-300">
				{label.cta_description}
			</p>
			<div class="w-full mt-8">
				<a
					class="block mx-auto w-fit rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
					href="https://quail.ink/firewood"
					target="_blank"
					rel="noreferrer"
				>
					{label.cta_button}
				</a>
			</div>

			<svg
				viewBox="0 0 1024 1024"
				aria-hidden="true"
				class="absolute left-1/2 top-1/2 -z-10 h-256 w-5xl -translate-x-1/2"
			>
				<circle
					r={512}
					cx={512}
					cy={512}
					fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
					fill-opacity="0.7"
				/>
				<defs>
					<radialGradient
						r={1}
						cx={0}
						cy={0}
						id="759c1415-0410-454c-8f7c-9a820de03641"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(512 512) rotate(90) scale(512)"
					>
						<stop stop-color="#7775D6" />
						<stop offset={1} stop-color="#E935C1" stop-opacity={0} />
					</radialGradient>
				</defs>
			</svg>
		</div>
	</div>
</div>

<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements';

  let { ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<!-- heroicons 24/outline x-mark -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  stroke-width="1.5"
  stroke="currentColor"
  aria-hidden="true"
  data-slot="icon"
  {...rest}
>
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>

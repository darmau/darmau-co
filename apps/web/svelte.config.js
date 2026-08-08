import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    alias: {
      $components: './src/lib/components',
      $icons: './src/lib/icons',
      $locales: './src/lib/locales',
      $utils: './src/lib/utils'
    },
    adapter: adapter({
      config: 'wrangler.jsonc'
    })
  }
};

export default config;

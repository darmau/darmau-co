import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// 字体分片不内联成 base64：内联会让字体样式表膨胀，而且失去按 unicode-range 按需下载的意义
		assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined)
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});

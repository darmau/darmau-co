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
      config: 'wrangler.jsonc',
      platformProxy: {
        // wrangler 会为 wrangler.jsonc 里标了 remote 的绑定（这里是 AI）先建一个
        // 远程预览会话，建不起来就整个 platform proxy 都拿不到，dev 下每个请求
        // 都变成 500——连不碰 AI 的页面也一样。关掉之后 dev 走本地模拟，
        // 代价是本地用不了两个依赖 Workers AI 的功能：/api/translate（想法翻译）
        // 和搜索页的 AutoRAG，调它们会返回 "Binding AI needs to be run remotely"。
        // 部署不受影响，remote 只是 dev 概念。需要在本地真调 Workers AI 时，
        // 把这行去掉再 `wrangler login`。
        remoteBindings: false
      }
    })
  }
};

export default config;

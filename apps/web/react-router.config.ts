import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // Cloudflare Workers：产物在 build/，client 交给 assets，server 由 workers/app.ts 引入
  buildDirectory: "build",
} satisfies Config;

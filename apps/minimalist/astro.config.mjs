// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'secret' }),
      IMG_PREFIX: envField.string({ context: 'server', access: 'secret' }),
    }
  },

  image: {
    domains: ["img.darmau.design"]
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
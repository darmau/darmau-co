import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default tseslint.config(
  {
    // flat config 不读 .eslintignore，生成产物必须在这里排除
    ignores: ['.svelte-kit/**', '.wrangler/**', 'build/**', 'static/**', 'node_modules/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 }
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        svelteConfig
      }
    }
  },
  {
    files: ['*.config.{js,ts}', 'worker-configuration.d.ts'],
    languageOptions: {
      globals: { ...globals.node }
    }
  }
);

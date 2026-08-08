import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default tseslint.config(
  {
    // flat config 不读 .eslintignore，生成产物必须在这里排除
    // worker-configuration.d.ts 由 `pnpm typegen`（wrangler types）生成，自带的
    // eslint-disable 指令在我们这套规则下是多余的，lint 它没有意义
    ignores: [
      '.svelte-kit/**',
      '.wrangler/**',
      'build/**',
      'static/**',
      'node_modules/**',
      'worker-configuration.d.ts'
    ]
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
  },
  {
    rules: {
      // 这条规则要求所有站内链接走 $app/paths 的 resolve()，为的是兼容配了
      // kit.paths.base 的部署。本站部署在域名根路径，base 是空串，
      // 上百个普通 <a href> 全变成噪音。
      'svelte/no-navigation-without-resolve': 'off'
    }
  }
);

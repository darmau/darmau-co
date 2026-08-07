import tseslint from 'typescript-eslint';

export default [
	// ESLint 9 的 flat config 不再读取 .eslintignore，生成产物必须在这里排除，
	// 否则 `pnpm lint` 会去 lint .svelte-kit 里的几千行生成代码。
	{
		ignores: [
			'.svelte-kit/**',
			'.wrangler/**',
			'build/**',
			'static/**',
			'playwright-report/**',
			'test-results/**'
		]
	},
	...tseslint.configs.recommended
];

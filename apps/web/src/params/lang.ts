import type { ParamMatcher } from '@sveltejs/kit';

export const LOCALES = ['zh', 'en', 'jp'] as const;

export type Locale = (typeof LOCALES)[number];

export const match: ParamMatcher = (param) => (LOCALES as readonly string[]).includes(param);

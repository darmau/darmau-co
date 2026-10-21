import type { ParamMatcher } from '@sveltejs/kit';

// 中文是默认语言，不带前缀；/zh/... 由 hooks 重定向回无前缀版本
export const match: ParamMatcher = (param) => param === 'ja' || param === 'en';

import { getContext, setContext } from 'svelte';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';

/**
 * 对应原 React 版本根路由的 `<Outlet context={{supabase, lang, prefix, turnstileSiteKey}}>`。
 * 组件树里到处都要用，逐层透传 prop 不现实。
 *
 * 注意：设置时必须传 getter 对象（见 +layout.svelte），否则导航切换语言后
 * context 里的值不会更新。
 */
export interface SiteContext {
	readonly supabase: SupabaseClient<Database>;
	readonly lang: string;
	/** 图片 CDN 前缀，来自 IMG_PREFIX */
	readonly prefix: string;
	readonly turnstileSiteKey: string;
}

const KEY = Symbol('site');

export const setSiteContext = (ctx: SiteContext) => setContext(KEY, ctx);

export const getSiteContext = (): SiteContext => getContext(KEY);

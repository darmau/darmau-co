import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import type { Env } from '../env';

export type Client = SupabaseClient<Database>;

export function createServiceClient(env: Env): Client {
	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
	}
	return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

/** 从 config 表读一条配置，读不到就抛——调用方需要的都是必填项。 */
export async function getConfigValue(client: Client, key: string): Promise<string> {
	const { data, error } = await client.from('config').select('value').eq('key', key).maybeSingle();

	if (error) throw new Error(`查询配置 ${key} 失败: ${error.message}`);

	const value = data?.value;
	if (typeof value !== 'string' || !value.trim()) throw new Error(`配置项 ${key} 未设置`);

	return value.trim();
}

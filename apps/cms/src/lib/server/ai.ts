import { error } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { TypedSupabaseClient } from '$lib/supabaseClient';
import type { ConfigRow } from '$lib/types/config';

const REQUIRED_KEYS = ['config_OPENAI', 'ai_GATEWAY_ENDPOINT', 'cf_AIG_TOKEN'] as const;

/**
 * 送进模型的正文长度上限。
 *
 * 这些端点虽然只有管理员能调，但请求体大小此前完全不设限：一次调用就能把
 * 几 MB 文本塞进 OpenAI，既是账单风险也是超时风险。取 200k 字符是因为它
 * 远大于站内最长的文章，同时又远小于"够用来烧钱"的量级。
 */
export const MAX_AI_INPUT_CHARS = 200_000;

/** 标题类短输入的上限 */
export const MAX_AI_TITLE_CHARS = 500;

/**
 * 校验请求体里的一个文本字段：必须是非空字符串且不超长。
 * 不合法直接抛 400，调用方不必自己写重复的判断。
 */
export function requireTextInput(
	value: unknown,
	field: string,
	maxChars = MAX_AI_INPUT_CHARS
): string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		error(400, `${field} is required`);
	}

	if (value.length > maxChars) {
		error(413, `${field} is too long (max ${maxChars} characters)`);
	}

	return value;
}

export async function loadAiConfigMap(
	supabase: TypedSupabaseClient,
	extraKeys: readonly string[] = []
): Promise<Map<string, string>> {
	const keys = [...REQUIRED_KEYS, ...extraKeys];
	const { data, error: supabaseError } = await supabase
		.from('config')
		.select('key, value')
		.in('key', keys);

	if (supabaseError) {
		console.error(supabaseError);
		error(500, 'Failed to fetch configuration');
	}

	const rows = (data ?? []) as ConfigRow[];
	return new Map(rows.map(({ key, value }) => [key, value ?? '']));
}

export function createGatewayOpenAI(configMap: Map<string, string>): OpenAI {
	const apiKey = configMap.get('config_OPENAI');
	const baseURL = configMap.get('ai_GATEWAY_ENDPOINT');
	const cfAIGToken = configMap.get('cf_AIG_TOKEN');

	if (!apiKey || !baseURL || !cfAIGToken) {
		error(500, 'AI gateway or OpenAI API key configuration not configured');
	}

	return new OpenAI({
		apiKey,
		baseURL,
		defaultHeaders: {
			'cf-aig-authorization': `Bearer ${cfAIGToken}`
		}
	});
}

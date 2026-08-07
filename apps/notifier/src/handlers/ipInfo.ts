import type { Json } from '@darmau/database';
import type { Env } from '../env';
import { fail, json, skip } from '../lib/http';
import { createServiceClient } from '../lib/supabase';
import type { WebhookPayload } from '../lib/webhook';

interface CommentRecord {
	id?: number;
	ip?: string | null;
}

export async function handleIpInfo(request: Request, env: Env): Promise<Response> {
	const payload = (await request.json()) as WebhookPayload<CommentRecord>;

	if (payload.table !== 'comment') return skip('忽略非 comment 表事件');

	const { id, ip } = payload.record ?? {};
	if (!id || !ip) return fail('缺少 id 或 ip 字段', 400);

	const ipInfo = await fetchIpInfo(ip);

	const client = createServiceClient(env);
	const { error } = await client.from('comment').update({ ip_info: ipInfo }).eq('id', id);

	if (error) throw new Error(`更新 comment.ip_info 失败: ${error.message}`);

	return json({ success: true, ipInfo });
}

async function fetchIpInfo(ip: string): Promise<Json> {
	const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}`);

	if (!response.ok) {
		throw new Error(`请求 IP 信息失败: ${response.status} ${await response.text()}`);
	}

	return (await response.json()) as Json;
}

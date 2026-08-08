import type { Json } from '@darmau/database';
import type { Env } from '../env';
import { fail, json, skip } from '../lib/http';
import { createServiceClient, getOptionalConfigValue } from '../lib/supabase';
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

	const client = createServiceClient(env);
	// ip-api 的免费接口只有明文 HTTP，pro 才给 HTTPS。配了 key 就自动走加密通道。
	const proKey = await getOptionalConfigValue(client, 'config_IPAPI_KEY');
	const ipInfo = await fetchIpInfo(ip, proKey);

	const { error } = await client.from('comment').update({ ip_info: ipInfo }).eq('id', id);

	if (error) throw new Error(`更新 comment.ip_info 失败: ${error.message}`);

	return json({ success: true, ipInfo });
}

/**
 * 查询访客 IP 归属地。
 *
 * 安全说明：不带 key 时只能走 `http://ip-api.com`——免费版不支持 HTTPS。
 * 这意味着访客 IP 以明文出网，且返回内容可被链路上的人篡改（结果会原样写进
 * `comment.ip_info`，最终显示在后台评论列表里）。返回值只当作展示用的不可信
 * 数据，不参与任何鉴权判断。要消除这条链路，在 config 表加一行
 * `config_IPAPI_KEY`（ip-api pro 的 key），这里就会自动切到 HTTPS。
 */
async function fetchIpInfo(ip: string, proKey: string | null): Promise<Json> {
	const encodedIp = encodeURIComponent(ip);
	const url = proKey
		? `https://pro.ip-api.com/json/${encodedIp}?key=${encodeURIComponent(proKey)}`
		: `http://ip-api.com/json/${encodedIp}`;

	const response = await fetch(url);

	if (!response.ok) {
		// 不要把响应体拼进错误消息：pro 模式下 URL 和回包都可能带 key
		throw new Error(`请求 IP 信息失败: ${response.status}`);
	}

	return (await response.json()) as Json;
}

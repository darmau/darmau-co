import type { Env } from '../env';
import { fail, json, skip } from '../lib/http';
import { createServiceClient, getConfigValue, type Client } from '../lib/supabase';
import type { WebhookPayload } from '../lib/webhook';

type SupportedTable = 'comment' | 'users' | 'message';

interface NotificationSegments {
	title: string;
	subtitle?: string;
	body?: string;
}

function isSupportedTable(table: string): table is SupportedTable {
	return table === 'comment' || table === 'users' || table === 'message';
}

export async function handleBark(request: Request, env: Env): Promise<Response> {
	const payload = (await request.json()) as WebhookPayload;
	console.log('收到 bark webhook:', payload.table, payload.type);

	if (payload.type !== 'INSERT') return skip('忽略非 INSERT 操作');
	if (!payload.table || !isSupportedTable(payload.table)) return skip('忽略未支持的表');
	if (!payload.record) return fail('缺少 record', 400);

	const client = createServiceClient(env);
	const segments = await buildSegments(client, payload.table, payload.record);
	if (!segments) return fail('未生成通知内容', 400);

	const barkServer = await getConfigValue(client, 'config_BARK_SERVER');
	const barkUrl = buildBarkUrl(barkServer, segments);

	const barkResponse = await fetch(barkUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ table: payload.table, record: payload.record })
	});

	if (!barkResponse.ok) {
		const responseText = await barkResponse.text();
		console.error('Bark 服务返回错误:', barkResponse.status, responseText);
		return fail('Bark 服务调用失败', 502, { status: barkResponse.status, response: responseText });
	}

	return json({ success: true, barkUrl });
}

async function buildSegments(
	client: Client,
	table: SupportedTable,
	record: Record<string, unknown>
): Promise<NotificationSegments | null> {
	switch (table) {
		case 'message': {
			const message = typeof record.message === 'string' ? record.message : '';
			const name = (await resolveUserName(client, record.user_id as number | null)) ?? '访客';
			return { title: '站内信', subtitle: `${name}向你发送了一条消息`, body: message };
		}

		case 'users': {
			const rawName = typeof record.name === 'string' ? record.name.trim() : '';
			const displayName =
				rawName || (await resolveUserName(client, record.id as number | null)) || '新用户';
			return { title: '新用户注册', subtitle: displayName };
		}

		case 'comment': {
			const fromUsers = await resolveUserName(client, (record.user_id as number | null) ?? null);
			const rawName = typeof record.name === 'string' ? record.name.trim() : '';
			const content = typeof record.content_text === 'string' ? record.content_text : '';
			return { title: '新评论', subtitle: fromUsers || rawName || '访客', body: content };
		}
	}
}

async function resolveUserName(client: Client, userId: number | null): Promise<string | null> {
	if (!userId) return null;

	const { data, error } = await client.from('users').select('name').eq('id', userId).maybeSingle();

	if (error) {
		console.error('查询用户名称失败:', error.message);
		return null;
	}

	const name = data?.name?.trim();
	return name ? name : null;
}

/** Bark 的推送格式是把 标题/副标题/正文 依次拼进 URL 路径。 */
function buildBarkUrl(baseUrl: string, segments: NotificationSegments): string {
	const base = baseUrl.replace(/\/+$/, '');
	const parts = [segments.title, segments.subtitle, segments.body]
		.filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
		.map((part) => encodeURIComponent(part.trim()));

	return `${base}/${parts.join('/')}`;
}

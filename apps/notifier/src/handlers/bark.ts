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
		// 第三方响应体可能带 Bark 的 device key 等敏感片段，只落日志
		console.error('Bark 服务返回错误:', barkResponse.status, await barkResponse.text());
		return fail('Bark 服务调用失败', 502);
	}

	// 同理不回显 barkUrl——它本身就包含 Bark 推送地址里的密钥段
	return json({ success: true });
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

/**
 * 校验 Bark 服务地址。
 *
 * `config_BARK_SERVER` 是库里的一行，这个 Worker 又持有 service_role key，
 * 所以它决定了带着评论内容（含邮箱、IP）的请求会发到哪台机器上。不校验的话，
 * 任何能写到 config 表的人都能把通知整体改道，甚至指向内网地址去探测。
 * 这里要求必须是 https 的公网主机名。
 */
function assertSafeBarkBase(baseUrl: string): URL {
	let parsed: URL;
	try {
		parsed = new URL(baseUrl);
	} catch {
		throw new Error('config_BARK_SERVER 不是合法 URL');
	}

	if (parsed.protocol !== 'https:') {
		throw new Error('config_BARK_SERVER 必须使用 https');
	}

	if (isPrivateHost(parsed.hostname)) {
		throw new Error('config_BARK_SERVER 不能指向内网地址');
	}

	return parsed;
}

/** 粗粒度的内网/回环地址判断，够挡住把通知改道到元数据服务或局域网的写法。 */
function isPrivateHost(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

	if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
		return true;
	}

	// IPv6 回环与唯一本地地址
	if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
		return true;
	}

	const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (!ipv4) {
		return false;
	}

	const a = Number(ipv4[1]);
	const b = Number(ipv4[2]);
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 169 && b === 254) || // link-local，云厂商元数据服务就在这里
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168)
	);
}

/** Bark 的推送格式是把 标题/副标题/正文 依次拼进 URL 路径。 */
function buildBarkUrl(baseUrl: string, segments: NotificationSegments): string {
	const base = assertSafeBarkBase(baseUrl).toString().replace(/\/+$/, '');
	const parts = [segments.title, segments.subtitle, segments.body]
		.filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
		.map((part) => encodeURIComponent(part.trim()));

	return `${base}/${parts.join('/')}`;
}

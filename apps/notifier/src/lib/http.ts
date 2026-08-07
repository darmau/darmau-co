const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** 明确"收到了但按业务规则跳过"，和出错区分开——旧 Edge Function 也是这么回的。 */
export function skip(message: string): Response {
	return json({ message });
}

export function fail(error: string, status: number, details?: unknown): Response {
	return json(details === undefined ? { error } : { error, details }, status);
}

/**
 * 校验 `Authorization: Bearer <WEBHOOK_SECRET>`。
 *
 * 旧的 Edge Function 靠 Supabase 网关校验 service role key，Worker 没有这层，
 * 所以自己来。先各自 SHA-256 再逐字节比较，避免长度和内容都从耗时上泄露。
 */
export async function isAuthorized(request: Request, secret: string): Promise<boolean> {
	if (!secret) return false;

	const header = request.headers.get('Authorization') ?? '';
	const prefix = 'Bearer ';
	if (!header.startsWith(prefix)) return false;

	const presented = header.slice(prefix.length);
	const [a, b] = await Promise.all([sha256(presented), sha256(secret)]);
	return timingSafeEqual(a, b);
}

async function sha256(value: string): Promise<Uint8Array> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return new Uint8Array(digest);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
	return diff === 0;
}

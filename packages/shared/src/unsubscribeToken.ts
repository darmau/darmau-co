/**
 * 评论通知邮件里"取消订阅"链接用的 HS256 JWT。
 *
 * 签发方（apps/notifier）和验证方（apps/web 的 /$lang/unsubscribe）必须用同一份
 * 实现，所以这个文件放在 @darmau/shared 里。只依赖 WebCrypto 和 btoa/atob，
 * Workers、Node 18+、浏览器都能跑。
 *
 * Payload: { comment_id, timestamp, iat }
 */

const MAX_TOKEN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

interface UnsubscribeTokenPayload {
	comment_id: number;
	timestamp: number;
	iat?: number;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		textEncoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
}

/** 签发退订 token。 */
export async function generateUnsubscribeToken(commentId: number, secret: string): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' };
	const now = Date.now();
	const payload: UnsubscribeTokenPayload = {
		comment_id: commentId,
		timestamp: now,
		iat: Math.floor(now / 1000)
	};

	const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
	const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
	const signingInput = `${encodedHeader}.${encodedPayload}`;

	const key = await importHmacKey(secret);
	const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(signingInput));

	return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * 验证并解析退订 token。
 * @returns 评论 ID；签名不对、格式不对或已过期都返回 null。
 */
export async function verifyUnsubscribeToken(
	token: string,
	secret: string,
	maxAgeMs: number = MAX_TOKEN_AGE_MS
): Promise<number | null> {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			console.warn('Unsubscribe token format invalid');
			return null;
		}

		const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];

		const header = JSON.parse(base64UrlDecodeToString(encodedHeader)) as { alg?: string };
		if (header?.alg !== 'HS256') {
			console.warn('Unexpected unsubscribe token algorithm');
			return null;
		}

		const key = await importHmacKey(secret);
		const signingInput = `${encodedHeader}.${encodedPayload}`;
		const expected = new Uint8Array(
			await crypto.subtle.sign('HMAC', key, textEncoder.encode(signingInput))
		);

		if (!timingSafeEqual(expected, base64UrlDecode(encodedSignature))) {
			console.warn('Unsubscribe token signature mismatch');
			return null;
		}

		const payload = JSON.parse(base64UrlDecodeToString(encodedPayload)) as UnsubscribeTokenPayload;
		const commentId = toFiniteNumber(payload.comment_id);
		const issuedAt = toFiniteNumber(payload.timestamp);

		if (commentId === null || issuedAt === null) {
			console.warn('Unsubscribe token payload invalid');
			return null;
		}

		if (Date.now() - issuedAt > maxAgeMs) {
			console.warn('Unsubscribe token expired');
			return null;
		}

		return commentId;
	} catch (error) {
		console.error('Failed to verify unsubscribe token:', error);
		return null;
	}
}

function toFiniteNumber(value: unknown): number | null {
	const n =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number.parseInt(value, 10)
				: Number.NaN;
	return Number.isFinite(n) ? n : null;
}

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Uint8Array {
	let normalized = input.replace(/-/g, '+').replace(/_/g, '/');
	const padding = (4 - (normalized.length % 4)) % 4;
	if (padding !== 0) normalized += '='.repeat(padding);

	const binary = atob(normalized);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function base64UrlDecodeToString(input: string): string {
	return textDecoder.decode(base64UrlDecode(input));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
	return diff === 0;
}

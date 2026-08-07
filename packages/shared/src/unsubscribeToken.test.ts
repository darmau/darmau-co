import { describe, expect, it } from 'vitest';
import { generateUnsubscribeToken, verifyUnsubscribeToken } from './unsubscribeToken';

const SECRET = 'test-unsubscribe-secret';

describe('unsubscribe token', () => {
	it('签发的 token 能被验证并还原出 comment id', async () => {
		const token = await generateUnsubscribeToken(4242, SECRET);
		await expect(verifyUnsubscribeToken(token, SECRET)).resolves.toBe(4242);
	});

	it('换一个密钥就验不过', async () => {
		const token = await generateUnsubscribeToken(1, SECRET);
		await expect(verifyUnsubscribeToken(token, 'another-secret')).resolves.toBeNull();
	});

	it('改了 payload 就验不过', async () => {
		const token = await generateUnsubscribeToken(1, SECRET);
		const [header, , signature] = token.split('.') as [string, string, string];
		const forged = btoa(JSON.stringify({ comment_id: 999, timestamp: Date.now() }))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/g, '');
		await expect(verifyUnsubscribeToken(`${header}.${forged}.${signature}`, SECRET)).resolves.toBeNull();
	});

	it('超过有效期就验不过', async () => {
		const token = await generateUnsubscribeToken(1, SECRET);
		// maxAge 传 -1，等价于"签发那一刻就已经过期"
		await expect(verifyUnsubscribeToken(token, SECRET, -1)).resolves.toBeNull();
	});

	it('格式不对直接返回 null，不抛异常', async () => {
		await expect(verifyUnsubscribeToken('not-a-jwt', SECRET)).resolves.toBeNull();
		await expect(verifyUnsubscribeToken('a.b', SECRET)).resolves.toBeNull();
	});

	it('header 里换算法也验不过（防 alg=none 之类）', async () => {
		const token = await generateUnsubscribeToken(1, SECRET);
		const [, payload, signature] = token.split('.') as [string, string, string];
		const noneHeader = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/g, '');
		await expect(
			verifyUnsubscribeToken(`${noneHeader}.${payload}.${signature}`, SECRET)
		).resolves.toBeNull();
	});
});

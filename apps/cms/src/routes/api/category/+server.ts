import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';

/**
 * id 列表校验。form action 侧有 parseIds()，但这里收的是 JSON body 而不是
 * FormData，所以单独实现一份同样严格的规则：只接受正整数数组，任何一项不合法
 * 就整体拒绝。此前这里把 body.ids 原样交给 `.in('id', ids)`，等于把过滤条件的
 * 构造权交给了客户端。
 */
function parseIdArray(value: unknown): number[] | null {
	if (!Array.isArray(value) || value.length === 0) {
		return null;
	}

	const ids: number[] = [];

	for (const item of value) {
		if (typeof item !== 'number' || !Number.isInteger(item) || item <= 0) {
			return null;
		}
		ids.push(item);
	}

	return ids;
}

export const DELETE: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals);

	const { supabase } = locals;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const ids = parseIdArray((body as { ids?: unknown } | null)?.ids);

	if (!ids) {
		return json({ error: 'No valid category ids provided' }, { status: 400 });
	}

	const { error } = await supabase.from('category').delete().in('id', ids);

	if (error) {
		console.error('[category] delete failed:', error);
		return json({ error: '删除分类失败' }, { status: 500 });
	}

	return json({ success: true });
};

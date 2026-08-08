import { type RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';

// type 会被直接当成关系名传给 PostgREST。虽然不是 SQL 注入且 RLS 仍然生效，
// 但不加白名单的话，将来任何一处 RLS 缺口或非 security_invoker 视图都会变成
// 一个可通过这个端点读取的存在性预言机。
const CHECKABLE_TABLES = ['article', 'photo'] as const;
type CheckableTable = (typeof CHECKABLE_TABLES)[number];

const isCheckableTable = (value: unknown): value is CheckableTable =>
	typeof value === 'string' && (CHECKABLE_TABLES as readonly string[]).includes(value);

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals);

	const { supabase } = locals;
	const { type, langId, slug, contentId } = await request.json();

	if (!isCheckableTable(type)) {
		return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
	}

	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	if (typeof slug !== 'string' || !slugRegex.test(slug)) {
		return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
	}

	// langId 之前直接进 .eq()，客户端可以塞任意类型进来当过滤条件。
	// 它是 language 表的自增主键，只可能是正整数。
	if (!Number.isInteger(langId) || langId <= 0) {
		return new Response(JSON.stringify({ error: 'Invalid language' }), { status: 400 });
	}

	const { data } = await supabase
		.from(type)
		.select('id, slug')
		.eq('slug', slug)
		.eq('lang', langId)
		.maybeSingle();

	if (!data) {
		return new Response(JSON.stringify({ success: 'Slug is available' }), { status: 200 });
	}

	if (data.id === contentId) {
		return new Response(JSON.stringify({ success: 'Slug is available' }), { status: 200 });
	} else {
		return new Response(JSON.stringify({ error: 'Slug is already in use' }), { status: 200 });
	}
};

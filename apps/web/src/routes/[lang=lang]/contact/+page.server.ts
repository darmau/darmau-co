import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const availableLangs = ['zh', 'en', 'jp'];

	return {
		baseUrl: platform?.env?.BASE_URL ?? '',
		availableLangs
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// 原来是 supabase.auth.getSession()，SvelteKit 版统一走 hooks 里缓存的
		// safeGetSession()（内部先 getUser() 校验过 JWT），语义一致。
		const { session } = await locals.safeGetSession();

		if (!session) {
			return fail(401, { error: '未登录用户无法提交信息', success: null });
		}

		const formData = await request.formData();
		const contactType = formData.get('contact_type') as string;
		const contact = formData.get('contact') as string;
		const message = formData.get('message') as string;

		// 去public.users表中查找当前用户的id
		const {
			data: user,
			error: userError
		} = await locals.supabase
			.from('users')
			.select('id, user_id, name')
			.eq('user_id', session.user.id)
			.single();

		if (userError) {
			return fail(500, { error: userError.message, success: null });
		}

		const { error } = await locals.supabase.from('message').insert({
			user_id: user.id,
			name: user.name,
			contact_type: contactType,
			contact_detail: contact,
			message
		});

		if (error) {
			return fail(500, { error: error.message, success: null });
		}

		return { success: '信息提交成功', error: null };
	}
};

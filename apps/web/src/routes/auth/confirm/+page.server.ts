import { fail, redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import ConfirmText from '$lib/locales/confirm';
import type { Actions, PageServerLoad } from './$types';

const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/**
 * action 失败时回给页面的数据。各分支返回的键不一样（有的带 values，有的不带），
 * 不统一声明一个类型的话 `form` 会变成一堆字面量类型的联合，页面里读 `form.values` 会报错。
 */
type ConfirmActionFail = {
	error: string;
	values?: {
		username?: string;
		website?: string;
	};
};

const failWith = (status: number, data: ConfirmActionFail) => fail(status, data);

function deriveLang(input?: string | null): SupportedLang {
	if (!input) return 'zh';

	try {
		const url = new URL(input, 'http://placeholder');
		const segments = url.pathname.split('/').filter(Boolean);
		const candidate = segments[0];
		if (candidate && SUPPORTED_LANGS.includes(candidate as SupportedLang)) {
			return candidate as SupportedLang;
		}
	} catch {
		const segments = input.split('/').filter(Boolean);
		const candidate = segments[0];
		if (candidate && SUPPORTED_LANGS.includes(candidate as SupportedLang)) {
			return candidate as SupportedLang;
		}
	}

	return 'zh';
}

// 同步用户信息到 public.users 表
async function syncUserToPublicTable(
	supabase: SupabaseClient<Database>,
	userId: string,
	username: string,
	website: string | null
) {
	const websiteValue = website ?? null;

	try {
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('user_id', userId)
			.maybeSingle();

		if (existingUser) {
			await supabase
				.from('users')
				.update({ name: username, website: websiteValue })
				.eq('user_id', userId);
		} else {
			await supabase
				.from('users')
				.insert({ user_id: userId, name: username, website: websiteValue });
		}
	} catch (error) {
		console.error('Failed to sync user to public.users:', error);
	}
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const redirectParam = url.searchParams.get('redirect');
	const needsUsernameParam = url.searchParams.get('needs_username');
	const emailParam = url.searchParams.get('email');
	const nextQuery = url.searchParams.get('next') ?? '/zh';
	const lang = deriveLang(nextQuery);

	console.log('=== Confirm Loader ===');
	console.log('Full URL:', url.toString());
	console.log('redirect param:', redirectParam);
	console.log('needs_username param:', needsUsernameParam);

	const supabase = locals.supabase;

	// 如果是重定向后的用户名表单页面（已验证过 token）
	if (needsUsernameParam === 'true') {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		// 确保有 session
		if (!session?.user) {
			console.log('No session found, redirecting to login');
			redirect(303, `/${lang}/login?error=magic_link`);
		}

		console.log('Showing username form for existing session');

		// 旧版在这里手工把 createClient 返回的 headers 拼进响应；SvelteKit 的 cookie
		// 由 event.cookies 统一写出，再拼一次会重复设置，所以删掉。
		return {
			needsUsername: true,
			userEmail: emailParam || session.user.email || null,
			lang,
			next: nextQuery
		};
	}

	// 如果有 redirect 参数（来自 magic link）
	if (redirectParam) {
		// 注意：redirect() 在 SvelteKit 里是靠抛异常实现的，所以下面所有跳转都必须
		// 留在 try 之外，否则会被 catch 吞掉。旧版把整段包在 try/catch 里，
		// 这里改成先算出目标地址，最后统一跳转。
		let destination: string | null = null;

		try {
			const redirectUrl = new URL(redirectParam);

			console.log('Redirect URL:', redirectUrl.toString());

			// 提取 token（注意：参数名是 token 不是 token_hash）
			const token = redirectUrl.searchParams.get('token');
			const type = redirectUrl.searchParams.get('type') as EmailOtpType | null;
			const code = redirectUrl.searchParams.get('code');

			console.log('Extracted tokens:', {
				token: token?.substring(0, 10) + '...',
				type,
				code: code?.substring(0, 10) + '...'
			});

			let verifyError = null;
			let tokenFound = false;

			// 验证 token
			if (code) {
				console.log('Using code to exchange for session');
				tokenFound = true;
				const { error } = await supabase.auth.exchangeCodeForSession(code);
				verifyError = error;
				if (error) {
					console.error('Code exchange failed:', error);
				}
			} else if (token && type) {
				console.log('Using token to verify OTP');
				tokenFound = true;
				// verifyOtp 的参数名是 token_hash
				const { error } = await supabase.auth.verifyOtp({
					token_hash: token,
					type
				});
				verifyError = error;
				if (error) {
					console.error('OTP verification failed:', error);
				}
			}

			// 没有找到任何 token
			if (!tokenFound) {
				console.error('No token found in redirect URL');
				destination = `/${lang}/login?error=magic_link`;
			} else if (verifyError) {
				// 验证失败
				console.error('Token verification failed:', verifyError);
				destination = `/${lang}/login?error=magic_link`;
			} else {
				// 验证成功，获取用户信息
				console.log('Token verified successfully, getting session');
				const {
					data: { session }
				} = await supabase.auth.getSession();

				if (!session?.user) {
					console.error('No session after verification');
					destination = `/${lang}/login?error=magic_link`;
				} else {
					console.log('Session found for user:', session.user.email);
					const hasUsername = !!session.user.user_metadata?.name;
					console.log('Has username:', hasUsername, session.user.user_metadata?.name);

					if (hasUsername) {
						// 如果已有用户名，同步到 public.users 并重定向
						console.log('User has username, syncing and redirecting');
						await syncUserToPublicTable(
							supabase,
							session.user.id,
							session.user.user_metadata.name,
							session.user.user_metadata.website ?? null
						);
						destination = nextQuery;
					} else {
						// 新用户需要设置用户名，重定向到不含 token 的 clean URL
						// 这样页面刷新时不会重复验证已失效的 token
						console.log('New user needs username, redirecting to clean URL');
						destination = `/auth/confirm?needs_username=true&email=${encodeURIComponent(
							session.user.email || ''
						)}&next=${encodeURIComponent(nextQuery)}`;
					}
				}
			}
		} catch (error) {
			console.error('Loader error:', error);
			destination = `/${lang}/login?error=magic_link`;
		}

		redirect(303, destination);
	}

	// 没有 redirect 参数，返回错误
	console.log('No redirect parameter found');
	redirect(303, `/${lang}/login?error=magic_link`);
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = (formData.get('username') as string | null)?.trim();
		const websiteInput = (formData.get('website') as string | null)?.trim();
		const nextPath = (formData.get('next') as string | null) ?? '/zh';
		const lang = deriveLang(nextPath);

		const supabase = locals.supabase;
		const labels = ConfirmText[lang] ?? ConfirmText.zh;

		// 获取当前 session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.user) {
			return failWith(401, { error: labels.invalid });
		}

		let website: string | null = null;

		if (websiteInput) {
			const normalizedWebsite =
				websiteInput.startsWith('http://') || websiteInput.startsWith('https://')
					? websiteInput
					: `https://${websiteInput}`;

			try {
				const parsedUrl = new URL(normalizedWebsite);
				website = parsedUrl.toString();
			} catch {
				return failWith(400, {
					error: labels.website_invalid,
					values: {
						username: username ?? '',
						website: websiteInput
					}
				});
			}
		}

		// 验证用户名
		if (!username) {
			return failWith(400, {
				error: labels.username_required,
				values: {
					website: websiteInput ?? ''
				}
			});
		}

		// 更新 user_metadata
		const { error: updateError } = await supabase.auth.updateUser({
			data: { name: username, email: session.user.email, website }
		});

		if (updateError) {
			console.error('Failed to update user metadata:', updateError);
			return failWith(500, {
				error: labels.invalid,
				values: {
					username,
					website: website ?? websiteInput ?? ''
				}
			});
		}

		// 同步到 public.users
		await syncUserToPublicTable(supabase, session.user.id, username, website);

		// 重定向到目标页面
		redirect(303, nextPath);
	}
};

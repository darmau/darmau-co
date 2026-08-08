import { error } from '@sveltejs/kit';
import { getClientIp } from '$lib/server/getClientIp';
import { validateCommentText } from '$lib/utils/commentContent';
import {
	buildCommentsStructuredData,
	generateBreadcrumbStructuredData,
	generateThoughtStructuredData
} from '$lib/utils/structuredData';
import { parseTurnstileOutcome } from '$lib/utils/turnstile';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals, platform }) => {
	const supabase = locals.supabase;
	const slug = params.slug;
	const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
	const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;

	// thought详情
	const { data: thoughtData } = await supabase
		.from('thought')
		.select(
			`
      id,
      content_json,
      content_text,
      slug,
      page_view,
      reactions,
      created_at
    `
		)
		.eq('slug', slug)
		.single();

	if (!thoughtData) {
		error(404, 'Thought not exists');
	}

	const [thoughtImagesResult, commentsResult, commentCountResult] = await Promise.all([
		supabase
			.from('thought_image')
			.select(
				`
        order,
        image (id, alt, storage_key, width, height, caption)
      `
			)
			.eq('thought_id', thoughtData.id)
			.order('order', { ascending: true }),
		supabase
			.from('comment')
			.select(
				`
        id,
        user_id,
        name,
        website,
        content_text,
        created_at,
        is_anonymous,
        users (id, name, website),
        reply_to (id, content_text, is_anonymous, name, users (id, name))
      `
			)
			.eq('to_thought', thoughtData.id)
			.eq('is_blocked', false)
			.eq('is_public', true)
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1),
		supabase
			.from('comment')
			.select('id', { count: 'exact' })
			.eq('to_thought', thoughtData.id)
			.eq('is_blocked', false)
			.eq('is_public', true)
	]);

	const thoughtImages = thoughtImagesResult.data ?? null;
	const comments = commentsResult.data ?? [];
	const count = commentCountResult.count;

	// 总页数
	const totalPage = count ? Math.ceil(count / limit) : 1;

	// 查询同样的slug是否有其他语言版本
	// 注意：thought 表可能没有 language 关联，这里假设所有语言都有对应内容
	// 如果实际数据库结构不同，需要根据实际情况调整
	const availableLangs = ['zh', 'en', 'jp'];

	// 生成结构化数据
	const env = platform?.env;
	const baseUrl = env?.BASE_URL ?? '';
	const imgPrefix = env?.IMG_PREFIX ?? '';
	const lang = params.lang;
	const currentUrl = `${baseUrl}/${lang}/thought/${slug}`;

	// 处理图片数据
	const processedImages =
		thoughtImages?.map((item) => {
			const image = item.image;
			return {
				alt: image.alt,
				storage_key: image.storage_key,
				width: image.width ?? 0,
				height: image.height ?? 0
			};
		}) || [];

	// 想法结构化数据
	const thoughtStructuredData = generateThoughtStructuredData({
		thought: {
			id: thoughtData.id || 0,
			slug: thoughtData.slug || '',
			content_text: thoughtData.content_text || '',
			content_html: null,
			created_at: thoughtData.created_at || new Date().toISOString(),
			location: null,
			page_view: thoughtData.page_view || 0,
			images: processedImages,
			comments: [{ count: count || 0 }]
		},
		baseUrl,
		imgPrefix,
		lang,
		url: currentUrl
	});

	// 面包屑结构化数据
	const breadcrumbStructuredData = generateBreadcrumbStructuredData([
		{ name: 'Home', url: `${baseUrl}/${lang}` },
		{ name: 'Thoughts', url: `${baseUrl}/${lang}/thoughts` },
		{
			name: thoughtData.content_text ? thoughtData.content_text.slice(0, 50) : 'Thought',
			url: currentUrl
		}
	]);

	// 评论结构化数据
	const commentStructuredData = buildCommentsStructuredData(comments, baseUrl, currentUrl);

	return {
		thoughtData,
		thoughtImages,
		comments,
		page,
		limit,
		totalPage,
		baseUrl,
		availableLangs,
		structuredData: {
			thought: thoughtStructuredData,
			breadcrumb: breadcrumbStructuredData,
			comments: commentStructuredData
		}
	};
};

export const actions: Actions = {
	comment: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const supabase = locals.supabase;
		const {
			data: { session }
		} = await supabase.auth.getSession();
		const { text: content_text, error: contentError } = validateCommentText(
			formData.get('content_text')
		);
		if (contentError) {
			return {
				success: false,
				error: contentError,
				comment: null
			};
		}
		const to_thought = parseInt(formData.get('to_thought') as string);
		const reply_to = formData.get('reply_to') ? parseInt(formData.get('reply_to') as string) : null;
		const receiveNotification = formData.get('receive_notification') === 'true';
		const ipAddress = getClientIp(request);

		if (!session) {
			const turnstileToken = formData.get('cf-turnstile-response');
			const turnstileResponse = await fetch(
				'https://challenges.cloudflare.com/turnstile/v0/siteverify',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						secret: platform?.env.TURNSTILE_SECRET_KEY ?? '',
						response: turnstileToken
					})
				}
			);

			const outcome = parseTurnstileOutcome(await turnstileResponse.json());
			if (!outcome.success) {
				return {
					success: false,
					error: '验证失败,请重试。',
					comment: null
				};
			}

			const name = formData.get('name') as string;
			const email = formData.get('email') as string;
			const website = formData.get('website') as string;

			// 不要 .select() 回读：匿名评论会被 set_comment_is_public 置为
			// is_public = false，RLS 随即把它过滤掉，回读只会拿到 0 行报错。
			const { error: insertError } = await supabase.from('comment').insert({
				name,
				email,
				website,
				content_text,
				to_thought,
				is_anonymous: true,
				reply_to,
				receive_notification: receiveNotification,
				ip: ipAddress
			});

			if (insertError) {
				return {
					success: false,
					error: insertError.message,
					comment: null
				};
			}

			return {
				success: '提交成功，请等待审核。Please wait for review.',
				error: null,
				comment: null
			};
		}

		const { data: userProfile } = await supabase
			.from('users')
			.select('id, user_id, name')
			.eq('user_id', session.user.id)
			.single();

		if (!userProfile) {
			return {
				success: false,
				error: 'User not exists',
				comment: null
			};
		}

		const { data: newComment } = await supabase
			.from('comment')
			.insert({
				user_id: userProfile.id,
				content_text,
				to_thought,
				is_anonymous: false,
				reply_to,
				receive_notification: receiveNotification,
				ip: ipAddress
			})
			.select(
				`
      id,
      user_id,
      content_text,
      created_at,
      is_anonymous,
      users (id, name)
    `
			)
			.single();

		// 旧代码这里返回的是 success: true（不是提示文案），照抄
		return {
			success: true,
			error: null,
			comment: newComment
		};
	}
};

import { error, fail } from '@sveltejs/kit';
import { getClientIp } from '$lib/server/getClientIp';
import { validateCommentText } from '$lib/utils/commentContent';
import { checkRateLimit } from '$lib/server/rateLimit';
import { safeExternalUrl } from '$lib/utils/safeUrl';
import { parseTurnstileOutcome } from '$lib/utils/turnstile';
import {
	generateArticleStructuredData,
	generateBreadcrumbStructuredData,
	buildCommentsStructuredData
} from '$lib/utils/structuredData';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;
	const slug = params.slug;
	const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
	const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;

	// 文章详情
	const { data: articleContent } = await supabase
		.from('article')
		.select(
			`
      id,
      title,
      slug,
      subtitle,
      abstract,
      updated_at,
      published_at,
      is_premium,
      is_featured,
      is_top,
      topic,
      content_json,
      page_view,
      reactions,
      category (title, slug),
      cover (alt, height, width, storage_key),
      language!inner (lang),
      lang
    `
		)
		.eq('slug', slug)
		.eq('language.lang', lang)
		.single();

	if (!articleContent) {
		error(404, 'Article not exists');
	}

	// 前一篇和后一篇文章
	const [
		previousArticleResult,
		nextArticleResult,
		commentsResult,
		commentCountResult,
		availableArticleResult
	] = await Promise.all([
		supabase
			.from('article')
			.select('title, slug, subtitle')
			.eq('lang', articleContent.lang!)
			.lt('published_at', articleContent.published_at)
			.order('published_at', { ascending: false })
			.limit(1)
			.maybeSingle(),
		supabase
			.from('article')
			.select('title, slug')
			.eq('lang', articleContent.lang!)
			.gt('published_at', articleContent.published_at)
			.order('published_at', { ascending: true })
			.limit(1)
			.maybeSingle(),
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
			.eq('to_article', articleContent.id)
			.eq('is_blocked', false)
			.eq('is_public', true)
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1),
		supabase
			.from('comment')
			.select('id', { count: 'exact' })
			.eq('to_article', articleContent.id)
			.eq('is_blocked', false)
			.eq('is_public', true),
		supabase
			.from('article')
			.select(
				`
        language!inner (lang)
      `
			)
			.eq('slug', slug)
	]);

	const previousArticle = previousArticleResult.data ?? null;
	const nextArticle = nextArticleResult.data ?? null;
	const comments = commentsResult.data ?? [];
	const count = commentCountResult.count;
	const availableArticle = availableArticleResult.data ?? [];

	// 总页数
	const totalPage = count ? Math.ceil(count / limit) : 1;

	// 转换成lang的数组，如['zh', 'en']
	const availableLangs = availableArticle.map((item) => item.language.lang as string);

	// 生成结构化数据
	const baseUrl = platform?.env?.BASE_URL ?? '';
	const imgPrefix = platform?.env?.IMG_PREFIX ?? '';
	const currentUrl = `${baseUrl}/${lang}/article/${slug}`;

	// 文章结构化数据
	const articleStructuredData = generateArticleStructuredData({
		article: {
			id: articleContent.id,
			title: articleContent.title || '',
			slug: articleContent.slug || '',
			subtitle: articleContent.subtitle,
			abstract: articleContent.abstract,
			is_featured: articleContent.is_featured,
			is_premium: articleContent.is_premium,
			topic: articleContent.topic,
			published_at: articleContent.published_at || new Date().toISOString(),
			updated_at: articleContent.updated_at,
			page_view: articleContent.page_view || 0,
			cover: articleContent.cover
				? {
						alt: articleContent.cover.alt,
						storage_key: articleContent.cover.storage_key,
						width: articleContent.cover.width || 0,
						height: articleContent.cover.height || 0
					}
				: null,
			category: {
				title: articleContent.category?.title || '',
				slug: articleContent.category?.slug || ''
			},
			comments: [{ count: count || 0 }],
			content_json: articleContent.content_json
		},
		baseUrl,
		imgPrefix,
		lang,
		url: currentUrl
	});

	// 面包屑结构化数据
	const breadcrumbStructuredData = generateBreadcrumbStructuredData([
		{ name: 'Home', url: `${baseUrl}/${lang}` },
		{ name: 'Articles', url: `${baseUrl}/${lang}/articles/1` },
		{ name: articleContent.title || 'Article', url: currentUrl }
	]);

	// 评论结构化数据
	const commentStructuredData = buildCommentsStructuredData(comments, baseUrl, currentUrl);

	// 付费墙必须在服务端生效。页面组件里那个 canViewContent 只控制显示与否，
	// 正文照样躺在 SSR payload 和 /__data.json 里，登出用户查看源码就能读全文。
	// 这里对无权限的请求直接不下发 content_json。
	const { session } = await locals.safeGetSession();
	const canViewContent = articleContent.is_premium !== true || !!session;

	return {
		article: canViewContent ? articleContent : { ...articleContent, content_json: null },
		canViewContent,
		previousArticle,
		nextArticle,
		domain: baseUrl,
		comments,
		page,
		limit,
		totalPage,
		baseUrl,
		prefix: imgPrefix,
		availableLangs,
		structuredData: {
			article: articleStructuredData,
			breadcrumb: breadcrumbStructuredData,
			comments: commentStructuredData
		}
	};
};

export const actions: Actions = {
	// 原来只有一个默认 action，CommentEditor 组件统一提交到 `?/comment`
	comment: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const supabase = locals.supabase;
		const { session } = await locals.safeGetSession();
		// 评论是公网写入口。匿名侧下面还有 Turnstile，这道限流对登录用户同样生效。
		if (!(await checkRateLimit(platform, 'RL_COMMENT', request))) {
			return fail(429, {
				success: false,
				error: '评论过于频繁，请稍后再试。Too many comments, please slow down.',
				comment: null
			});
		}
		const { text: content_text, error: contentError } = validateCommentText(
			formData.get('content_text')
		);
		if (contentError) {
			return fail(400, {
				success: false,
				error: contentError,
				comment: null
			});
		}
		const to_article = parseInt(formData.get('to_article') as string);
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
						secret: platform?.env?.TURNSTILE_SECRET_KEY ?? '',
						response: turnstileToken
					})
				}
			);

			const outcome = parseTurnstileOutcome(await turnstileResponse.json());
			if (!outcome.success) {
				return fail(400, {
					success: false,
					error: '验证失败,请重试。',
					comment: null
				});
			}

			const name = formData.get('name') as string;
			const email = formData.get('email') as string;
			// 存进库的 website 会在评论区渲染成 <a href>，写入侧就限定协议，
			// 免得已有数据把 XSS 防线全押在渲染侧那一处校验上。
			const website = safeExternalUrl(formData.get('website'));

			// 不要 .select() 回读：匿名评论会被 set_comment_is_public 置为
			// is_public = false，RLS 随即把它过滤掉，回读只会拿到 0 行报错。
			const { error: insertError } = await supabase.from('comment').insert({
				name,
				email,
				website,
				content_text,
				to_article,
				is_anonymous: true,
				reply_to,
				receive_notification: receiveNotification,
				ip: ipAddress
			});

			if (insertError) {
				// Postgres 的原始报错会暴露表名、约束名和 RLS 策略细节，
				// 匿名评论是公网入口，只回通用文案。
				console.error('Anonymous comment insert failed:', insertError);
				return fail(500, {
					success: false,
					error: '提交失败，请稍后重试。Failed to submit, please try again.',
					comment: null
				});
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
			return fail(400, {
				success: false,
				error: 'User not exists',
				comment: null
			});
		}

		const { data: newComment } = await supabase
			.from('comment')
			.insert({
				user_id: userProfile.id,
				content_text,
				to_article,
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
        users (id, name),
        reply_to (id, content_text, users (id, name))
      `
			)
			.single();

		return {
			success: '评论成功。Comment success.',
			error: null,
			comment: newComment
		};
	}
};

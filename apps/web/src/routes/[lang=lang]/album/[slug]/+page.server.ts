import { error } from '@sveltejs/kit';
import { getClientIp } from '$lib/server/getClientIp';
import { validateCommentText } from '$lib/utils/commentContent';
import {
	buildCommentsStructuredData,
	generateAlbumStructuredData,
	generateBreadcrumbStructuredData
} from '$lib/utils/structuredData';
import { parseTurnstileOutcome } from '$lib/utils/turnstile';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals, platform }) => {
	const supabase = locals.supabase;
	const lang = params.lang;
	const slug = params.slug;
	const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
	const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;

	// 摄影详情
	const { data: albumContent } = await supabase
		.from('photo')
		.select(
			`
      id,
      title,
      slug,
      abstract,
      published_at,
      content_json,
      content_text,
      topic,
      page_view,
      reactions,
      category (title, slug),
      language!inner (lang)
    `
		)
		.eq('slug', slug)
		.eq('language.lang', lang)
		.single();

	if (!albumContent) {
		error(404, 'Album not exists');
	}

	// 根据相册id去photo_image以及关联的image表查询图片详细信息
	const [albumImagesResult, commentsResult, commentCountResult, availableAlbumsResult] =
		await Promise.all([
			supabase
				.from('photo_image')
				.select(
					`
        order,
        image (
          alt,
          caption,
          height,
          width,
          storage_key,
          exif,
          location,
          latitude,
          longitude
        )
      `
				)
				.eq('photo_id', albumContent.id)
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
				.eq('to_photo', albumContent.id)
				.eq('is_blocked', false)
				.eq('is_public', true)
				.order('created_at', { ascending: false })
				.range((page - 1) * limit, page * limit - 1),
			supabase
				.from('comment')
				.select('id', { count: 'exact' })
				.eq('to_photo', albumContent.id)
				.eq('is_blocked', false)
				.eq('is_public', true),
			supabase
				.from('photo')
				.select(
					`
        language!inner (lang)
      `
				)
				.eq('slug', slug)
		]);

	const albumImages = albumImagesResult.data ?? null;
	const comments = commentsResult.data ?? [];
	const count = commentCountResult.count;
	const availableAlbums = availableAlbumsResult.data ?? [];

	// 总页数
	const totalPage = count ? Math.ceil(count / limit) : 1;

	// 转换成lang的数组，如['zh', 'en']
	const availableLangs = availableAlbums.map((item) => item.language.lang as string);

	// 生成结构化数据
	const env = platform?.env;
	const baseUrl = env?.BASE_URL ?? '';
	const imgPrefix = env?.IMG_PREFIX ?? '';
	const currentUrl = `${baseUrl}/${lang}/album/${slug}`;

	// 处理图片数据，提取 EXIF 和位置信息。
	// 注意：上面的 select 没有取 image.id，旧代码里的 `image.id || 0` 因此恒为 0，照抄。
	const processedImages =
		albumImages?.map((item) => {
			const image = item.image;
			return {
				id: 0,
				alt: image.alt,
				caption: image.caption,
				storage_key: image.storage_key,
				width: image.width ?? 0,
				height: image.height ?? 0,
				exif: image.exif,
				location: image.location,
				latitude: image.latitude,
				longitude: image.longitude,
				date: null,
				taken_at: null
			};
		}) || [];

	// 相册结构化数据
	const albumStructuredData = generateAlbumStructuredData({
		album: {
			id: albumContent.id || 0,
			title: albumContent.title || '',
			slug: albumContent.slug || '',
			abstract: albumContent.abstract,
			published_at: albumContent.published_at || new Date().toISOString(),
			page_view: albumContent.page_view || 0,
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
		{ name: 'Albums', url: `${baseUrl}/${lang}/albums/all/1` },
		{ name: albumContent.title || 'Album', url: currentUrl }
	]);

	// 评论结构化数据
	const commentStructuredData = buildCommentsStructuredData(comments, baseUrl, currentUrl);

	return {
		albumContent,
		albumImages,
		MAPBOX: env?.MAPBOX_TOKEN ?? '',
		comments,
		page,
		limit,
		totalPage,
		baseUrl,
		prefix: imgPrefix,
		availableLangs,
		structuredData: {
			album: albumStructuredData,
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
		const to_photo = parseInt(formData.get('to_photo') as string);
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
				to_photo,
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
				to_photo,
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

import type { Thought } from '$components/ThoughtCard.svelte';
import { normalizeCommentCount } from '$lib/utils/articles';
import { isJsonValue } from '$lib/utils/json';
import type { Actions, PageServerLoad } from './$types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const toComments = normalizeCommentCount;

const toThoughtImages = (value: unknown): Thought['thought_image'] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => {
			if (!isRecord(item)) {
				return null;
			}
			const image = item['image'];
			if (!isRecord(image)) {
				return null;
			}

			const id = image['id'];
			const storageKey = image['storage_key'];
			if (typeof id !== 'number' || typeof storageKey !== 'string') {
				return null;
			}

			const altValue = image['alt'];
			const widthValue = image['width'];
			const heightValue = image['height'];

			return {
				image: {
					id,
					storage_key: storageKey,
					alt: typeof altValue === 'string' ? altValue : null,
					width: typeof widthValue === 'number' ? widthValue : 0,
					height: typeof heightValue === 'number' ? heightValue : 0
				}
			};
		})
		.filter((item): item is Thought['thought_image'][number] => item !== null);
};

const asThought = (value: unknown): Thought | null => {
	if (!isRecord(value)) {
		return null;
	}

	const id = value['id'];
	const slug = value['slug'];
	const contentJson = value['content_json'];
	const contentText = value['content_text'];
	const createdAt = value['created_at'];
	const pageView = value['page_view'];

	if (typeof id !== 'number') {
		return null;
	}
	if (typeof slug !== 'string' || slug.length === 0) {
		return null;
	}
	if (typeof createdAt !== 'string' || createdAt.length === 0) {
		return null;
	}

	const content_json = isJsonValue(contentJson) ? contentJson : null;
	const comments = toComments(value['comments']);
	const thought_image = toThoughtImages(value['thought_image']);

	return {
		id,
		slug,
		content_json,
		content_text: typeof contentText === 'string' ? contentText : '',
		created_at: createdAt,
		page_view: typeof pageView === 'number' ? pageView : 0,
		comments,
		thought_image
	};
};

const normalizeThoughts = (value: unknown): Thought[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map(asThought).filter((item): item is Thought => item !== null);
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	const { data: thoughts } = await locals.supabase
		.from('thought')
		.select(
			`
      id,
      slug,
      content_json,
      content_text,
      created_at,
      page_view,
      comments:comment(id),
      thought_image (
        image (id, alt, storage_key, width, height)
      )
   `
		)
		.order('created_at', { ascending: false })
		.limit(12);

	const availableLangs = ['zh', 'en', 'jp'];

	return {
		thoughts: normalizeThoughts(thoughts),
		baseUrl: platform?.env.BASE_URL ?? '',
		availableLangs
	};
};

export const actions: Actions = {
	// 旧版是 useFetcher 往同一个 action POST 的「加载更多」，这里拆成具名 action
	loadmore: async ({ request, locals }) => {
		const formData = await request.formData();
		const page = parseInt(formData.get('page') as string);

		const { data, error } = await locals.supabase
			.from('thought')
			.select(
				`
    id,
    slug,
    content_json,
    content_text,
    created_at,
    page_view,
    comments:comment(id),
    thought_image (
      image (id, alt, storage_key, width, height)
    )
  `
			)
			.range(page * 12, (page + 1) * 12 - 1)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error('获取更多思想数据失败', { cause: error });
		}

		return { thoughts: normalizeThoughts(data) };
	}
};

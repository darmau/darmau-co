import type { Actions, PageServerLoad } from './$types';

export type BookRecord = {
	id: number;
	title: string;
	rate: number;
	comment: string | null;
	link: string | null;
	date: string | null;
	cover: {
		id: string | number;
		alt: string | null;
		storage_key: string;
	} | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const normalizeBooks = (rows: unknown): BookRecord[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	const normalized: BookRecord[] = [];

	rows.forEach((row) => {
		if (!isRecord(row)) {
			return;
		}

		const id = row['id'];
		if (typeof id !== 'number') {
			return;
		}

		const title = row['title'];
		const rate = row['rate'];
		const comment = row['comment'];
		const link = row['link'];
		const date = row['date'];
		const coverValue = row['cover'];

		const cover =
			isRecord(coverValue) && typeof coverValue['storage_key'] === 'string'
				? {
						id:
							typeof coverValue['id'] === 'number' || typeof coverValue['id'] === 'string'
								? coverValue['id']
								: id,
						alt: typeof coverValue['alt'] === 'string' ? (coverValue['alt'] as string) : null,
						storage_key: coverValue['storage_key'] as string
					}
				: null;

		normalized.push({
			id,
			title: typeof title === 'string' ? title : '',
			rate: typeof rate === 'number' ? rate : 0,
			comment: typeof comment === 'string' ? comment : null,
			link: typeof link === 'string' ? link : null,
			date: typeof date === 'string' ? date : null,
			cover
		});
	});

	return normalized;
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	const supabase = locals.supabase;

	const { data: bookData } = await supabase
		.from('book')
		.select(
			`
      id,
      title,
      rate,
      comment,
      link,
      date,
      cover (id, alt, storage_key)
    `
		)
		.order('date', { ascending: false })
		.range(0, 19);

	// 总数
	const { count } = await supabase.from('book').select('id', { count: 'exact' });

	const availableLangs = ['zh', 'en', 'jp'];
	const env = platform?.env;

	return {
		books: normalizeBooks(bookData),
		prefix: env?.IMG_PREFIX ?? '',
		baseUrl: env?.BASE_URL ?? '',
		availableLangs,
		count: count ?? null
	};
};

export const actions: Actions = {
	// 旧版是 useFetcher 往同一个 action POST 的「加载更多」，这里拆成具名 action
	loadmore: async ({ request, locals }) => {
		const formData = await request.formData();
		const page = parseInt(formData.get('page') as string);

		const { data, error } = await locals.supabase
			.from('book')
			.select(
				`
    id,
    title,
    date,
    link,
    rate,
    comment,
    cover (id, alt, storage_key)
  `
			)
			.range(page * 20, (page + 1) * 20 - 1)
			.order('date', { ascending: false });

		if (error) {
			throw new Error('获取更多读书数据失败');
		}

		return {
			books: normalizeBooks(data)
		};
	}
};

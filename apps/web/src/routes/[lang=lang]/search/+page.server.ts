import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const availableLangs = ['zh', 'en', 'jp'];

	return {
		baseUrl: platform?.env.BASE_URL ?? '',
		availableLangs
	};
};

export const actions: Actions = {
	// 旧版是路由的默认 action（`<Form method="post">`），这里拆成具名 action
	search: async ({ request, platform }) => {
		try {
			const formData = await request.formData();
			const query = formData.get('query');

			if (!query || typeof query !== 'string' || query.trim() === '') {
				return {
					error: 'Query is required',
					results: null
				};
			}

			const ai = platform?.env.AI;
			if (!ai) {
				return {
					error: 'AI service is not available',
					results: null
				};
			}

			const autorag = ai.autorag('blog-ai');

			// 旧代码这里挂了个 @ts-expect-error，说 workers-types 没声明 `model` /
			// `retrieval_options`；当前版本的 AutoRagAiSearchRequest 已经能接受它们，
			// 直接传即可（再留着 @ts-expect-error 反而会报 "unused directive"）。
			const response = await autorag.aiSearch({
				query: query.trim(),
				model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
				rewrite_query: true,
				max_num_results: 10,
				retrieval_options: {
					enabled: true,
					model: '@cf/qwen/qwen3-30b-a3b-fp8'
				},
				ranking_options: {
					score_threshold: 0.3
				},
				reranking: {
					enabled: true,
					model: '@cf/baai/bge-reranker-base'
				},
				stream: false
			});

			return {
				error: null,
				results: response
			};
		} catch (err) {
			console.error('Search error:', err);
			return {
				error: err instanceof Error ? err.message : 'An unknown error occurred',
				results: null
			};
		}
	}
};

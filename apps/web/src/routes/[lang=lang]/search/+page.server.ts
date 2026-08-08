import { checkRateLimit } from '$lib/server/rateLimit';
import type { Actions, PageServerLoad } from './$types';

/** AutoRAG 查询的输入上限，避免超长 query 直接打到模型上 */
const MAX_QUERY_LENGTH = 500;

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
			// 搜索不需要登录，单次 AutoRAG 调用开销又不小，先限流
			if (!(await checkRateLimit(platform, 'RL_SEARCH', request))) {
				return {
					error: '请求过于频繁，请稍后再试。Too many requests.',
					results: null
				};
			}

			const formData = await request.formData();
			const query = formData.get('query');

			if (!query || typeof query !== 'string' || query.trim() === '') {
				return {
					error: 'Query is required',
					results: null
				};
			}

			if (query.length > MAX_QUERY_LENGTH) {
				return {
					error: 'Query is too long',
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
			// 原始 err.message 里可能带 AutoRAG / AI Gateway 的内部信息，
			// 记进日志就行，回给公网访客的只能是通用文案。
			console.error('Search error:', err);
			return {
				error: '搜索暂时不可用，请稍后再试。Search is temporarily unavailable.',
				results: null
			};
		}
	}
};

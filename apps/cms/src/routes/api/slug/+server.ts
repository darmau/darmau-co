import { error, type RequestHandler } from '@sveltejs/kit';
import {
	createGatewayOpenAI,
	loadAiConfigMap,
	MAX_AI_TITLE_CHARS,
	requireTextInput
} from '$lib/server/ai';
import { requireAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals);

	// 此前 title 完全没有类型校验就直接送进模型
	const body = await request.json();
	const title = requireTextInput(body?.title, 'Title', MAX_AI_TITLE_CHARS);

	const configMap = await loadAiConfigMap(locals.supabase, ['prompt_SLUG', 'model_SLUG']);
	const prompt = configMap.get('prompt_SLUG');
	const model = configMap.get('model_SLUG') ?? 'gpt-5.1';

	if (!prompt) {
		error(500, 'Slug prompt not configured');
	}

	const openai = createGatewayOpenAI(configMap);

	let slug = '';
	try {
		const response = await openai.responses.create({
			model,
			instructions: prompt,
			input: title
		});
		slug = response.output_text?.trim() ?? '';
	} catch (err) {
		console.error(err);
		error(502, 'Error generating slug');
	}

	return new Response(slug, {
		headers: { 'Content-Type': 'text/plain' }
	});
};

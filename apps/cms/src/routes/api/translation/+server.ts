import { error, type RequestHandler } from '@sveltejs/kit';
import { createGatewayOpenAI, loadAiConfigMap, requireTextInput } from '$lib/server/ai';
import { requireAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals);

	const body = await request.json();
	const content = requireTextInput(body?.content, 'Content');
	const langInput = typeof body?.lang === 'string' ? body.lang.trim() : '';

	if (!langInput) {
		error(400, 'Target language is required');
	}

	// 原来是 `instructions: prompt + lang`，把请求体里的任意字符串直接拼进系统
	// 指令，等于把系统提示的写入权交给了调用方。语言不能写死（后台可以自行增删
	// 语言），所以改成回 language 表核对：只有已配置的 locale 才允许拼进去，
	// 拼进去的也是库里那一份，不是请求体里那一份。
	const { data: language, error: languageError } = await locals.supabase
		.from('language')
		.select('locale')
		.eq('locale', langInput)
		.maybeSingle();

	if (languageError) {
		console.error('[translation] language lookup failed:', languageError);
		error(500, 'Failed to resolve target language');
	}

	if (!language) {
		error(400, 'Unsupported target language');
	}

	const configMap = await loadAiConfigMap(locals.supabase, [
		'prompt_TRANSLATION',
		'model_TRANSLATION'
	]);
	const prompt = configMap.get('prompt_TRANSLATION');
	const model = configMap.get('model_TRANSLATION') ?? 'gpt-5.1';

	if (!prompt) {
		error(500, 'Translation prompt not configured');
	}

	const openai = createGatewayOpenAI(configMap);

	let translatedHtml = '';
	try {
		const response = await openai.responses.create({
			model,
			// 保持原来的拼接形式（prompt_TRANSLATION 的文案就是按"以目标语言结尾"
			// 写的），只是拼进去的值现在来自库而不是请求体
			instructions: prompt + language.locale,
			input: content
		});
		translatedHtml = response.output_text?.trim() ?? '';
	} catch (err) {
		console.error(err);
		error(502, 'Error generating translation');
	}

	return new Response(translatedHtml, {
		headers: { 'Content-Type': 'text/plain' }
	});
};

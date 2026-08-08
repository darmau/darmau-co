import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type TranslationResponse = {
	translation?: string;
	error?: string;
};

const SUPPORTED_TARGET_LANGS = new Set(['en', 'jp']);

const jsonResponse = (body: TranslationResponse, status?: number) => json(body, { status });

// 原来是 React Router 的 resource route action，方法判断写在函数体里；
// SvelteKit 按方法分发，非 POST 会自动 405，所以那段判断删掉了。
// ThoughtCard 用裸 fetch 提交 FormData 并读 JSON，请求/响应形状必须保持不变。
export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();
	const text = formData.get('text');
	const targetLang = formData.get('targetLang');

	if (typeof text !== 'string' || text.trim().length === 0) {
		return jsonResponse({ error: 'Text is required' }, 400);
	}

	if (typeof targetLang !== 'string' || !SUPPORTED_TARGET_LANGS.has(targetLang)) {
		return jsonResponse({ error: 'Unsupported target language' }, 400);
	}

	const ai = platform?.env?.AI;
	if (!ai) {
		return jsonResponse({ error: 'AI service unavailable' }, 503);
	}

	const normalizedTargetLang = targetLang === 'jp' ? 'ja' : targetLang;

	try {
		const result = await ai.run(
			'@cf/meta/m2m100-1.2b',
			{
				text: text.trim(),
				source_lang: 'zh',
				target_lang: normalizedTargetLang
			},
			{
				gateway: { id: 'shinano' }
			}
		);

		let translation = '';
		if (typeof result === 'string') {
			translation = result;
		} else if (result && typeof result === 'object') {
			const candidate = result as {
				response?: unknown;
				result?: unknown;
				output?: unknown;
				translated_text?: unknown;
				outputs?: { output_text?: unknown }[];
			};
			const direct =
				candidate.translated_text ??
				candidate.response ??
				candidate.result ??
				candidate.output ??
				(Array.isArray(candidate.outputs) ? candidate.outputs[0]?.output_text : undefined);
			if (typeof direct === 'string') {
				translation = direct;
			}
		}

		if (!translation || translation.trim().length === 0) {
			translation = typeof result === 'object' ? JSON.stringify(result) : String(result ?? '');
		}

		return jsonResponse({ translation: translation.trim() });
	} catch (error) {
		console.error('Translation error:', error);
		return jsonResponse({ error: 'Translation failed' }, 500);
	}
};

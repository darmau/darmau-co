import { error, type RequestHandler } from '@sveltejs/kit';
import { createGatewayOpenAI, loadAiConfigMap } from '$lib/server/ai';
import { requireAdmin } from '$lib/server/auth';

type GenerateImageRequest = {
	prompt?: unknown;
	size?: unknown;
	quality?: unknown;
};

type ImageSize = 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
type ImageQuality = 'auto' | 'low' | 'medium' | 'high';

const DEFAULT_SIZE: ImageSize = 'auto';
const DEFAULT_QUALITY: ImageQuality = 'auto';

function parseSize(value: unknown): ImageSize {
	if (typeof value !== 'string') {
		return DEFAULT_SIZE;
	}

	const allowedSizes: ImageSize[] = ['auto', '1024x1024', '1536x1024', '1024x1536'];
	return allowedSizes.includes(value as ImageSize) ? (value as ImageSize) : DEFAULT_SIZE;
}

function parseQuality(value: unknown): ImageQuality {
	if (typeof value !== 'string') {
		return DEFAULT_QUALITY;
	}

	const allowed: ImageQuality[] = ['auto', 'low', 'medium', 'high'];
	return allowed.includes(value as ImageQuality) ? (value as ImageQuality) : DEFAULT_QUALITY;
}

function parseDimensions(size: ImageSize) {
	if (size === 'auto') {
		return { width: 1024, height: 1024 };
	}

	const [width, height] = size.split('x').map((dim) => Number.parseInt(dim, 10));
	return {
		width: Number.isFinite(width) ? width : 1024,
		height: Number.isFinite(height) ? height : 1024
	};
}

/** 出图提示词的长度上限，防止一次请求把超长文本推给计费接口 */
const MAX_PROMPT_CHARS = 4000;

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAdmin(locals);

	const body = (await request.json()) as GenerateImageRequest;
	const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

	if (!prompt) {
		error(400, 'Prompt is required');
	}

	if (prompt.length > MAX_PROMPT_CHARS) {
		error(413, `Prompt is too long (max ${MAX_PROMPT_CHARS} characters)`);
	}

	const size = parseSize(body.size);
	const quality = parseQuality(body.quality);

	const configMap = await loadAiConfigMap(locals.supabase);
	const openai = createGatewayOpenAI(configMap);

	try {
		const requestPayload: Record<string, unknown> = {
			model: 'gpt-5',
			input: prompt,
			tools: [{ type: 'image_generation' }]
		};

		const toolConfig: { image_generation: Record<string, unknown> } = {
			image_generation: {}
		};

		if (size !== 'auto') {
			toolConfig.image_generation.size = size;
		}

		if (quality !== 'auto') {
			toolConfig.image_generation.quality = quality;
		}

		if (Object.keys(toolConfig.image_generation).length > 0) {
			requestPayload.tool_config = toolConfig;
		}

		const response = await openai.responses.create(requestPayload as never);

		type ImageGenerationCall = {
			type: 'image_generation_call';
			result?: string | null;
		};

		function isImageGenerationCall(output: unknown): output is ImageGenerationCall {
			return (
				typeof output === 'object' &&
				output !== null &&
				(output as { type?: unknown }).type === 'image_generation_call'
			);
		}

		const outputs = ((response as unknown as { output?: unknown[] }).output ?? []) as unknown[];
		const imageOutputs = outputs.filter(isImageGenerationCall);
		const base64Image = imageOutputs
			.map((item) => item.result)
			.find((result): result is string => typeof result === 'string' && result.length > 0);

		if (!base64Image) {
			console.error('OpenAI response missing image payload', response);
			return new Response(
				JSON.stringify({ error: 'Image generation failed: empty response from model.' }),
				{
					status: 502,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const { width, height } = parseDimensions(size);

		return new Response(
			JSON.stringify({
				image: {
					b64_json: base64Image,
					revised_prompt:
						((response as unknown as { output_text?: string | null }).output_text ?? '')?.trim() ||
						null,
					width,
					height,
					mime_type: 'image/webp'
				},
				created:
					(response as unknown as { created?: number }).created ??
					(response as unknown as { created_at?: number }).created_at ??
					Date.now()
			}),
			{
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		// 供应商返回的原始 message 里可能带账号 / 配额 / 密钥前缀之类的信息，
		// 记进日志即可，回给浏览器的只留通用文案。
		console.error('OpenAI image generation failed', err);

		return new Response(JSON.stringify({ error: 'Image generation failed.' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

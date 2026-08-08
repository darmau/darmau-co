import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ platform }) => {
	const baseUrl = platform?.env?.BASE_URL ?? '';

	const robotText = [
		'User-agent: Googlebot',
		'',
		'User-agent: *',
		'Allow: /',
		'Disallow: /*/login',
		'Disallow: /*/unsubscribe',
		'Disallow: /auth/*',
		'',
		`Sitemap: ${baseUrl}/sitemap-index.xml`,
		''
	].join('\n');

	return new Response(robotText, {
		headers: { 'Content-Type': 'text/plain' }
	});
};

import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ platform }) => {
	const baseUrl = platform?.env?.BASE_URL ?? '';

	const sitemap = `
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>${baseUrl}/zh/sitemap.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${baseUrl}/en/sitemap.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${baseUrl}/jp/sitemap.xml</loc>
      </sitemap>
    </sitemapindex>
  `;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'xml-version': '1.0',
			encoding: 'UTF-8'
		}
	});
};

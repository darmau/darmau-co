// adapter-cloudflare 会按 Cache-Control 把 GET 响应放进边缘缓存（caches.default）。
// 内容在 CMS 里改完，最多 10 分钟后生效；过期后的一天内先回旧页面、后台再刷新。
export const PAGE_CACHE = {
	'cache-control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400'
};

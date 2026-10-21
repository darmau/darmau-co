// adapter-cloudflare 会按 Cache-Control 把 GET 响应放进边缘缓存（caches.default）。
// 内容在 CMS 里改完，最多 10 分钟后生效；过期后的一天内先回旧页面、后台再刷新。
export const PAGE_CACHE = {
	'cache-control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400'
};

// 首页的瀑布流是从精选相册里随机挑的，缓存时间短一些，让刷新能看到不同的组合
export const HOME_CACHE = {
	'cache-control': 'public, max-age=0, s-maxage=60'
};

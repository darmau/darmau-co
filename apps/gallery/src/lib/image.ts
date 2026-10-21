// 衍生图全部走 Cloudflare Image Transformations（和博客同一套）：
// R2 里的原图在 CMS 上传时已经剥掉 EXIF，format=auto 按 Accept 头回 AVIF / WebP / JPEG，
// 变换结果默认不带元数据，所以既不需要预生成，也不需要 <picture> 分格式。

export const WIDTHS = [480, 960, 1600, 2400, 3200] as const;

export function imageUrl(prefix: string, key: string, width: number, quality = 82): string {
	return `${prefix}/cdn-cgi/image/format=auto,quality=${quality},width=${width}/${key}`;
}

/** 不超过原图宽度的档位；原图比最小档还窄时只给原图宽度 */
export function srcset(prefix: string, key: string, originalWidth: number): string {
	const widths = WIDTHS.filter((w) => w <= originalWidth);
	if (!widths.length) widths.push(originalWidth as (typeof WIDTHS)[number]);
	return widths.map((w) => `${imageUrl(prefix, key, w)} ${w}w`).join(', ');
}

/** 32px 宽、模糊过的小图，几百字节，作为加载前的占位底图 */
export function placeholderUrl(prefix: string, key: string): string {
	return `${prefix}/cdn-cgi/image/format=auto,quality=40,width=32,blur=4/${key}`;
}

/** OG 图：1600 宽的 JPEG，社交平台对 AVIF 支持参差 */
export function ogImageUrl(prefix: string, key: string): string {
	return `${prefix}/cdn-cgi/image/format=jpeg,quality=82,width=1600/${key}`;
}

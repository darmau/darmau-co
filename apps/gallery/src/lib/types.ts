// 页面层使用的数据模型。全部由 src/lib/server/normalize.ts 从 Supabase 的
// photo / photo_image / image 三张表推导出来，不依赖任何新增字段：
//
// - 照片没有独立标题：用解析出的地名作标题，image.caption 作手记（多数为空，空就不显示）
// - 相册没有副标题：取照片里出现最多的地名
// - 没有 LQIP / 主色：用 cdn-cgi 出一张 32px 模糊小图当占位（见 lib/image.ts）
// - 地名只有一串地址，不分语言：按地址原文的语言显示

export interface Exif {
	make: string | null;
	/** 机身，已去掉重复的厂商前缀，如 "iPhone 15 Pro"、"ILCE-7M4" */
	camera: string | null;
	lens: string | null;
	/** mm */
	focalLength: number | null;
	focalLength35: number | null;
	aperture: number | null;
	/** 秒 */
	exposureTime: number | null;
	iso: number | null;
	/** EV */
	exposureComp: number | null;
}

export interface Coord {
	lat: number;
	lng: number;
	/** 海拔，米；EXIF 里没有就是 null */
	alt: number | null;
}

export interface Place {
	/** 地名，市 / 县级，如「长野市」「道孚县」「臺北市」 */
	name: string;
	/** 行政区，如「長野県」「四川省 甘孜藏族自治州」「台湾」 */
	region: string | null;
}

export interface Photo {
	/** image.id，作为 URL 里的 photoId。重新排序不会改变它 */
	id: string;
	/** 1 起的编号 */
	index: number;
	storageKey: string;
	width: number;
	height: number;
	alt: string;
	/** image.caption */
	note: string | null;
	/**
	 * 拍摄时间。有时区时是带偏移的 ISO 串（2025-11-13T14:24:52+09:00），
	 * EXIF 没记录时区时是不带偏移的当地时间（2025-11-13T14:24:52）。
	 */
	takenAt: string | null;
	exif: Exif;
	coord: Coord | null;
	place: Place | null;
	/** 原始地址串，信息面板里显示 */
	address: string | null;
}

/** 列表页（首页、全部相册、足迹地图）用的精简相册 */
export interface AlbumSummary {
	/** 相册编号，按发布时间从 1 起，最新的最大 */
	no: number;
	slug: string;
	title: string;
	abstract: string | null;
	publishedAt: string;
	pinned: boolean;
	/** CMS 里勾选的「精选」 */
	featured: boolean;
	cover: Photo;
	photoCount: number;
	place: Place | null;
	/** 所有照片坐标的中心点，足迹地图用 */
	center: Coord | null;
	/** YYYY-MM-DD，当地日期 */
	dateRange: { start: string; end: string } | null;
	/** 该语言没有翻译、回落到了中文 */
	fallback: boolean;
}

/** 卡片只需要封面的这几项；列表页有上百个相册，整份 Photo 会让 HTML 膨胀好几倍 */
export type CardImage = Pick<Photo, 'storageKey' | 'width' | 'height' | 'alt'>;

/** 瀑布流卡片、「下一个相册」用的最小数据 */
export type AlbumCard = Pick<
	AlbumSummary,
	'no' | 'slug' | 'title' | 'photoCount' | 'place' | 'center' | 'dateRange' | 'fallback'
> & { cover: CardImage };

export interface Album extends AlbumSummary {
	/** CMS 写的 HTML 正文 */
	descriptionHtml: string | null;
	photos: Photo[];
	altitudeRange: [number, number] | null;
	gear: { cameras: string[]; lenses: string[] };
}

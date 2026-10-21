import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@darmau/database';
import { DB_LANG, type Lang } from '$lib/i18n';
import type { Album, AlbumSummary, Coord, Photo, Place } from '$lib/types';
import { EXIF_KEYS, altitude, normalizeExif, takenAt, type RawExif } from './exif';
import { cleanAddress, parsePlace } from './place';

type Client = SupabaseClient<Database>;

export function getSupabase(env: App.Platform['env'] | undefined): Client {
	if (!env?.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
		throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY are not configured');
	}
	return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

// ---- 查询 ------------------------------------------------------------------

// EXIF 只取用得到的键，整份 EXIF 有六七十个字段
const EXIF_SELECT = EXIF_KEYS.map((key) => `x_${key}:exif->${key}`).join(',');
const IMAGE_SELECT = `id,alt,caption,width,height,storage_key,location,latitude,longitude,taken_at,${EXIF_SELECT}`;

const ALBUM_SELECT = `id,slug,title,abstract,published_at,is_top,language!inner(lang),
	cover:image!photo_cover_fkey(${IMAGE_SELECT}),
	photo_image(order,image(${IMAGE_SELECT}))`;

interface ImageRow {
	id: number;
	alt: string | null;
	caption: string | null;
	width: number | null;
	height: number | null;
	storage_key: string;
	location: string | null;
	latitude: number | null;
	longitude: number | null;
	taken_at: string | null;
	[exifKey: `x_${string}`]: unknown;
}

interface AlbumRow {
	id: number;
	slug: string;
	title: string;
	abstract: string | null;
	published_at: string | null;
	is_top: boolean | null;
	content_html?: string | null;
	language: { lang: string };
	cover: ImageRow | null;
	photo_image: { order: number | null; image: ImageRow | null }[];
}

/**
 * 每个相册在库里按语言各存一行，靠 slug 关联。一次把「当前语言 + 中文」都取回来，
 * 当前语言缺翻译的相册回落到中文那一行。
 */
async function fetchAlbumRows(supabase: Client, lang: Lang, slug?: string, withContent = false) {
	const langs = [...new Set([DB_LANG[lang], DB_LANG.zh])];
	let query = supabase
		.from('photo')
		.select(withContent ? `${ALBUM_SELECT},content_html` : ALBUM_SELECT)
		.eq('is_draft', false)
		.in('language.lang', langs)
		.order('published_at', { ascending: false });
	if (slug) query = query.eq('slug', slug);

	const { data, error } = await query;
	if (error) throw new Error(`Failed to load albums: ${error.message}`);
	const rows = data as unknown as AlbumRow[];

	const want = DB_LANG[lang];
	const bySlug = new Map<string, { row: AlbumRow; fallback: boolean; zh?: AlbumRow }>();
	for (const row of rows) {
		const entry = bySlug.get(row.slug);
		if (row.language.lang === DB_LANG.zh) {
			if (entry) entry.zh = row;
			else bySlug.set(row.slug, { row, fallback: want !== DB_LANG.zh, zh: row });
		}
		if (row.language.lang === want) {
			bySlug.set(row.slug, { row, fallback: false, zh: entry?.zh });
		}
	}
	// 排序以中文行的发布时间为准：各语言行的 published_at 是分别填的，会差几个小时
	return [...bySlug.values()]
		.map(({ row, fallback, zh }) => ({ row, fallback, sortKey: (zh ?? row).published_at ?? '' }))
		.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

// ---- 归一化 ----------------------------------------------------------------

function rawExif(row: ImageRow): RawExif {
	const raw: RawExif = {};
	for (const key of EXIF_KEYS) raw[key] = row[`x_${key}`];
	return raw;
}

function toPhoto(row: ImageRow, index: number): Photo | null {
	// 没有尺寸就无法预留版面，宁可不显示
	if (!row.width || !row.height) return null;
	const raw = rawExif(row);
	const coord: Coord | null =
		row.latitude !== null && row.longitude !== null
			? { lat: row.latitude, lng: row.longitude, alt: altitude(raw) }
			: null;

	return {
		id: String(row.id),
		index,
		storageKey: row.storage_key,
		width: row.width,
		height: row.height,
		alt: row.alt ?? '',
		note: row.caption?.trim() || null,
		takenAt: takenAt(raw, row.taken_at),
		exif: normalizeExif(raw),
		coord,
		place: coord ? parsePlace(row.location) : null,
		address: coord ? cleanAddress(row.location) : null
	};
}

function mostCommonPlace(photos: Photo[]): Place | null {
	const counts = new Map<string, { place: Place; n: number }>();
	for (const { place } of photos) {
		if (!place) continue;
		const entry = counts.get(place.name) ?? { place, n: 0 };
		entry.n++;
		counts.set(place.name, entry);
	}
	let best: { place: Place; n: number } | null = null;
	for (const entry of counts.values()) if (!best || entry.n > best.n) best = entry;
	return best?.place ?? null;
}

function center(photos: Photo[]): Coord | null {
	const coords = photos.map((p) => p.coord).filter((c): c is Coord => !!c);
	if (!coords.length) return null;
	const sum = coords.reduce((acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }), { lat: 0, lng: 0 });
	return { lat: sum.lat / coords.length, lng: sum.lng / coords.length, alt: null };
}

function dateRange(photos: Photo[]) {
	const days = photos
		.map((p) => p.takenAt?.slice(0, 10))
		.filter((d): d is string => !!d)
		.sort();
	return days.length ? { start: days[0]!, end: days.at(-1)! } : null;
}

function uniq(values: (string | null)[]): string[] {
	return [...new Set(values.filter((v): v is string => !!v))];
}

function toAlbum(row: AlbumRow, fallback: boolean): Album | null {
	const photos = row.photo_image
		.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0))
		.map((pi) => pi.image)
		.filter((img): img is ImageRow => !!img)
		.map((img, i) => toPhoto(img, i + 1))
		.filter((p): p is Photo => !!p)
		// 过滤掉无尺寸的图之后重新编号，保证编号连续
		.map((p, i) => ({ ...p, index: i + 1 }));

	// 封面优先用 photo.cover；它不一定在相册图片里，所以单独查了一份
	const cover = (row.cover && toPhoto(row.cover, 0)) ?? photos[0];
	if (!cover) return null;

	const altitudes = photos.map((p) => p.coord?.alt).filter((a): a is number => a != null);

	return {
		// 编号要看全部相册的顺序才知道，由 listAlbums / 页面 load 补上
		no: 0,
		slug: row.slug,
		title: row.title,
		abstract: row.abstract?.trim() || null,
		publishedAt: row.published_at ?? '',
		pinned: !!row.is_top,
		cover: photos.find((p) => p.id === cover.id) ?? cover,
		photoCount: photos.length,
		place: mostCommonPlace(photos),
		center: center(photos),
		dateRange: dateRange(photos),
		fallback,
		descriptionHtml: row.content_html?.trim() || null,
		photos,
		altitudeRange: altitudes.length ? [Math.min(...altitudes), Math.max(...altitudes)] : null,
		gear: {
			cameras: uniq(photos.map((p) => p.exif.camera)),
			lenses: uniq(photos.map((p) => p.exif.lens))
		}
	};
}

function toSummary(album: Album): AlbumSummary {
	const { descriptionHtml: _d, photos: _p, altitudeRange: _a, gear: _g, ...summary } = album;
	return summary;
}

// ---- 对外接口 --------------------------------------------------------------

// 同一个 isolate 里短时间内的重复请求（首页、相册页的「下一个相册」）共用一次查询。
// 跨 isolate 的缓存靠页面响应的 Cache-Control + adapter-cloudflare 的边缘缓存。
const LIST_TTL = 60_000;
const listCache = new Map<Lang, { at: number; value: Promise<AlbumSummary[]> }>();

export function listAlbums(supabase: Client, lang: Lang): Promise<AlbumSummary[]> {
	const hit = listCache.get(lang);
	if (hit && Date.now() - hit.at < LIST_TTL) return hit.value;

	const value = fetchAlbumRows(supabase, lang).then((rows) => {
		const albums = rows.map(({ row, fallback }) => toAlbum(row, fallback)).filter((a): a is Album => !!a);
		return albums.map((album, i) => ({ ...toSummary(album), no: albums.length - i }));
	});
	listCache.set(lang, { at: Date.now(), value });
	value.catch(() => listCache.delete(lang));
	return value;
}

export async function getAlbum(supabase: Client, lang: Lang, slug: string): Promise<Album | null> {
	const [entry] = await fetchAlbumRows(supabase, lang, slug, true);
	return entry ? toAlbum(entry.row, entry.fallback) : null;
}

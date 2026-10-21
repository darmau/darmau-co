import type { Exif } from '$lib/types';

/** 从 image.exif 里实际用到的键。查询时用 JSON 箭头只取这些，不把整份 EXIF 拉下来 */
export const EXIF_KEYS = [
	'Make',
	'Model',
	'LensModel',
	'FocalLength',
	'FocalLengthIn35mmFormat',
	'FNumber',
	'ExposureTime',
	'ISO',
	'ExposureCompensation',
	'DateTimeOriginal',
	'OffsetTimeOriginal',
	'OffsetTime',
	'GPSAltitude',
	'GPSAltitudeRef'
] as const;

export type RawExif = Partial<Record<(typeof EXIF_KEYS)[number], unknown>>;

function num(value: unknown): number | null {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim() !== '') {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	// exifr 偶尔给出 [24, 70] 这样的数组（LensInfo 之类），取第一个
	if (Array.isArray(value)) return num(value[0]);
	return null;
}

function str(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

export function normalizeExif(raw: RawExif): Exif {
	const make = str(raw.Make);
	let camera = str(raw.Model);
	// "Canon" + "Canon EOS R5" → "Canon EOS R5"；"Apple" + "iPhone 15 Pro" 保持原样
	if (make && camera && !camera.toLowerCase().startsWith(make.toLowerCase().split(' ')[0]!)) {
		camera = /^(apple|google)$/i.test(make) ? camera : `${make} ${camera}`;
	}

	return {
		make,
		camera,
		lens: str(raw.LensModel),
		focalLength: num(raw.FocalLength),
		focalLength35: num(raw.FocalLengthIn35mmFormat),
		aperture: num(raw.FNumber),
		exposureTime: num(raw.ExposureTime),
		iso: num(raw.ISO),
		exposureComp: num(raw.ExposureCompensation)
	};
}

const WALL_CLOCK = /^(\d{4})[-:](\d{2})[-:](\d{2})[T ](\d{2}):(\d{2}):(\d{2})/;
const OFFSET = /^[+-]\d{2}:\d{2}$/;

/**
 * 拍摄时间。
 *
 * CMS 在 Worker（UTC）里用 exifr 解析，exifr 把不带时区的 DateTimeOriginal
 * 按运行环境的本地时区转成 Date，于是库里存的是「当地钟面时间 + Z」：
 * 长野 14:24 拍的照片存成 2025-11-13T14:24:52.000Z。image.taken_at 同样如此。
 *
 * 所以这里把末尾的 Z 当作没有意义，只取钟面时间，再拼上 OffsetTimeOriginal。
 */
export function takenAt(raw: RawExif, fallback: string | null): string | null {
	const source = str(raw.DateTimeOriginal) ?? fallback;
	const m = source?.match(WALL_CLOCK);
	if (!m) return null;

	const wall = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
	const offset = str(raw.OffsetTimeOriginal) ?? str(raw.OffsetTime);
	return offset && OFFSET.test(offset) ? `${wall}${offset}` : wall;
}

/** 海拔（米）。GPSAltitudeRef = 1 表示海平面以下 */
export function altitude(raw: RawExif): number | null {
	const value = num(raw.GPSAltitude);
	if (value === null) return null;
	return num(raw.GPSAltitudeRef) === 1 ? -value : value;
}

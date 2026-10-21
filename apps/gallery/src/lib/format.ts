import type { Coord, Exif } from '$lib/types';

// 页面上所有等宽显示的参数都从这里出，保证首页、相册页、查看器格式一致

export function shutter(seconds: number | null): string | null {
	if (seconds === null || seconds <= 0) return null;
	if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
	return `1/${Math.round(1 / seconds)}s`;
}

export function aperture(f: number | null): string | null {
	return f === null ? null : `ƒ/${Number(f.toFixed(1))}`;
}

/** 有 35mm 等效焦距时优先显示等效值（手机的 6.77mm 对读者没有意义） */
export function focal(exif: Exif): string | null {
	const value = exif.focalLength35 ?? exif.focalLength;
	return value === null ? null : `${Math.round(value)}mm`;
}

export function iso(value: number | null): string | null {
	return value === null ? null : `ISO ${value}`;
}

export function ev(value: number | null): string | null {
	if (value === null || value === 0) return null;
	const rounded = Number(value.toFixed(1));
	return `${rounded > 0 ? '+' : ''}${rounded} EV`;
}

/** 机身 / 焦距 / 光圈 / 快门 / ISO 的一行，缺的项直接跳过 */
export function exifLine(exif: Exif): string[] {
	return [exif.camera, focal(exif), aperture(exif.aperture), shutter(exif.exposureTime), iso(exif.iso)].filter(
		(v): v is string => !!v
	);
}

function hemi(value: number, pos: string, neg: string, digits: number): string {
	return `${Math.abs(value).toFixed(digits)}°${value >= 0 ? pos : neg}`;
}

export function lat(value: number, digits = 4): string {
	return hemi(value, 'N', 'S', digits);
}

export function lng(value: number, digits = 4): string {
	return hemi(value, 'E', 'W', digits);
}

export function coord(c: Coord, digits = 4): string {
	return `${lat(c.lat, digits)} ${lng(c.lng, digits)}`;
}

export function meters(value: number | null): string | null {
	return value === null ? null : `${Math.round(value)} m`;
}

// takenAt 是「当地钟面时间（+偏移）」，直接截字符串，不经过 Date，
// 否则浏览器会把它换算到看的人所在的时区

/** 2025.11 */
export function yearMonth(date: string): string {
	return `${date.slice(0, 4)}.${date.slice(5, 7)}`;
}

/** 2025.11.13 */
export function day(date: string): string {
	return date.slice(0, 10).replaceAll('-', '.');
}

/** 2025.11.13 – 2025.11.15；同一天只显示一次 */
export function dateRange(range: { start: string; end: string }): string {
	return range.start === range.end ? day(range.start) : `${day(range.start)} – ${day(range.end)}`;
}

/** 2025.11.13 14:24 */
export function shortDateTime(takenAt: string): string {
	return `${day(takenAt)} ${takenAt.slice(11, 16)}`;
}

/** 2025.11.13 14:24:52 GMT+09:00；没有时区就不带后缀 */
export function fullDateTime(takenAt: string): string {
	const offset = takenAt.slice(19);
	return `${day(takenAt)} ${takenAt.slice(11, 19)}${offset ? ` GMT${offset}` : ''}`;
}

export function pad(n: number, width = 2): string {
	return String(n).padStart(width, '0');
}

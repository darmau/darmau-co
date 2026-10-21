// Web Mercator 换算，和 Mapbox 的缩放级别一致：z 级时全世界宽 512·2^z 像素。
// 用来在 Mapbox 静态底图上精确叠放 SVG 路线和编号点，不必加载 Mapbox GL。

const TILE = 512;
const MAX_LAT = 85.0511287798;

/** 经纬度 → z=0 时的世界坐标（0..1） */
export function project(lng: number, lat: number): [number, number] {
	const φ = (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180;
	const x = (lng + 180) / 360;
	const y = (1 - Math.log(Math.tan(Math.PI / 4 + φ / 2)) / Math.PI) / 2;
	return [x, y];
}

export function unprojectLat(y: number): number {
	return (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
}

export interface Viewport {
	lng: number;
	lat: number;
	zoom: number;
	/** 把经纬度换成画布上的像素位置 */
	toPixel: (lng: number, lat: number) => [number, number];
}

/** 让所有点落进 width×height 的画布（留 padding），等价于 GL 的 fitBounds */
export function fitBounds(
	points: { lng: number; lat: number }[],
	width: number,
	height: number,
	{ padding = 48, maxZoom = 13 } = {}
): Viewport {
	const xy = points.map((p) => project(p.lng, p.lat));
	const xs = xy.map((p) => p[0]);
	const ys = xy.map((p) => p[1]);
	const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

	const spanX = (x1 - x0) * TILE;
	const spanY = (y1 - y0) * TILE;
	const fit = Math.min(
		spanX > 0 ? (width - padding * 2) / spanX : Infinity,
		spanY > 0 ? (height - padding * 2) / spanY : Infinity
	);
	// Static Images API 会把 zoom 舍到两位小数；这里先向下取整，保证底图和叠加层用的是同一个值，
	// 而且向下取保证点不会被挤出 padding
	const raw = Math.max(0, Math.min(maxZoom, Number.isFinite(fit) ? Math.log2(fit) : maxZoom));
	const zoom = Math.floor(raw * 100) / 100;

	const cx = (x0 + x1) / 2;
	const cy = (y0 + y1) / 2;
	const scale = TILE * 2 ** zoom;

	return {
		lng: cx * 360 - 180,
		lat: unprojectLat(cy),
		zoom,
		toPixel: (lng, lat) => {
			const [x, y] = project(lng, lat);
			return [width / 2 + (x - cx) * scale, height / 2 + (y - cy) * scale];
		}
	};
}

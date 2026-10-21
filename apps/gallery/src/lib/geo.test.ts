import { describe, expect, it } from 'vitest';
import { fitBounds, project, unprojectLat } from './geo';

describe('mercator', () => {
	it('round-trips latitude', () => {
		for (const lat of [-60, 0, 13.4075, 36.6041, 70]) {
			expect(unprojectLat(project(0, lat)[1])).toBeCloseTo(lat, 9);
		}
	});

	it('puts the origin in the middle of the world', () => {
		expect(project(0, 0)).toEqual([0.5, 0.5]);
	});
});

describe('fitBounds', () => {
	const W = 640;
	const H = 480;
	const pts = [
		{ lng: 138.1, lat: 36.5 },
		{ lng: 138.4, lat: 36.7 }
	];

	it('keeps every point inside the padded canvas', () => {
		const vp = fitBounds(pts, W, H, { padding: 48 });
		for (const p of pts) {
			const [x, y] = vp.toPixel(p.lng, p.lat);
			expect(x).toBeGreaterThanOrEqual(48 - 1e-6);
			expect(x).toBeLessThanOrEqual(W - 48 + 1e-6);
			expect(y).toBeGreaterThanOrEqual(48 - 1e-6);
			expect(y).toBeLessThanOrEqual(H - 48 + 1e-6);
		}
	});

	it('touches the padding on the limiting axis', () => {
		const vp = fitBounds(pts, W, H, { padding: 48, maxZoom: 22 });
		const xs = pts.map((p) => vp.toPixel(p.lng, p.lat)[0]);
		const ys = pts.map((p) => vp.toPixel(p.lng, p.lat)[1]);
		const usedX = Math.max(...xs) - Math.min(...xs);
		const usedY = Math.max(...ys) - Math.min(...ys);
		// zoom 向下取整到两位小数，最多差 2^0.01 ≈ 0.7%
		expect(Math.max(usedX / (W - 96), usedY / (H - 96))).toBeCloseTo(1, 1);
	});

	it('centres a single point at maxZoom', () => {
		const vp = fitBounds([{ lng: 99.99, lat: 13.4 }], W, H, { maxZoom: 13 });
		expect(vp.zoom).toBe(13);
		const [x, y] = vp.toPixel(99.99, 13.4);
		expect(x).toBeCloseTo(W / 2, 6);
		expect(y).toBeCloseTo(H / 2, 6);
	});
});

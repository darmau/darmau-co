import type { Place } from '$lib/types';

// image.location 是 CMS 上传时反查出来的一整串地址，来源不同格式也不同：
//
//   大陆（高德）：四川省甘孜藏族自治州道孚县鲜水镇解放西街128号
//   日本（Mapbox）：日本, 〒381-2217 長野県長野市稲里町中央４丁目９番１６号
//   台湾（Mapbox）：27 襄陽路, 100, 中正區, 臺北市, 台湾 / 台湾桃園市
//   没有 GPS：No GPS data
//
// 这里只取到市 / 县一级，门牌号不出现在页面标题和卡片上。

const NO_GPS = /^no gps/i;

// 自治州、地区、盟下面直接挂县，县名比州名更有辨识度（格尔木市 vs 海西蒙古族藏族自治州）
const PREFECTURE_TOO_BROAD = /(自治州|地区|盟)$/;
// 县级名称里不能出现这些，否则说明匹配到了乡镇街道
const COUNTY = /^([^镇乡街路号]{1,10}?(?:市|县|区|旗))/;

function parseMainland(address: string): Place | null {
	const m = address.match(/^(.+?(?:省|自治区|特别行政区))?(.+?(?:市|自治州|地区|盟))(.*)$/);
	if (!m) return null;
	const [, province, prefecture, rest] = m as unknown as [string, string | undefined, string, string];

	if (PREFECTURE_TOO_BROAD.test(prefecture)) {
		const county = rest.match(COUNTY)?.[1];
		if (county) return { name: county, region: [province, prefecture].filter(Boolean).join(' ') };
	}

	// 直辖市：北京市朝阳区… → 北京市，行政区留空
	return { name: prefecture, region: province ?? null };
}

function parseJapan(address: string): Place | null {
	const body = address.replace(/^日本,\s*/, '').replace(/^〒\d{3}-\d{4}\s*/, '');
	const m = body.match(/^(.+?[都道府県])(.+?郡.+?[町村]|.+?[市区町村])/);
	if (!m) return null;
	return { name: m[2]!, region: m[1]! };
}

function parseTaiwan(address: string): Place | null {
	if (address.includes(',')) {
		const parts = address.split(',').map((s) => s.trim());
		const city = parts.at(-2);
		return city ? { name: city, region: '台湾' } : null;
	}
	const m = address.match(/^(?:台湾|臺灣)(.+?[市縣])/);
	return m ? { name: m[1]!, region: '台湾' } : null;
}

/** 其他国家多是 Mapbox 的「街道, 城市, 国家」逗号格式 */
function parseGeneric(address: string): Place | null {
	const parts = address
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s && !/^[\d\s〒-]+$/.test(s));
	if (parts.length >= 2) return { name: parts.at(-2)!, region: parts.at(-1)! };
	return parts[0] ? { name: parts[0], region: null } : null;
}

export function parsePlace(address: string | null | undefined): Place | null {
	const value = address?.trim();
	if (!value || NO_GPS.test(value)) return null;

	if (value.startsWith('日本')) return parseJapan(value) ?? parseGeneric(value);
	if (/(台湾|臺灣)/.test(value)) return parseTaiwan(value) ?? parseGeneric(value);
	if (/^[一-鿿]/.test(value) && !value.includes(',')) {
		return parseMainland(value) ?? { name: value.slice(0, 12), region: null };
	}
	return parseGeneric(value);
}

/** 原始地址只去掉邮编，给查看器信息面板的「地址」行用 */
export function cleanAddress(address: string | null | undefined): string | null {
	const value = address?.trim();
	if (!value || NO_GPS.test(value)) return null;
	return value.replace(/〒\d{3}-\d{4}\s*/, '');
}

import type zh from './zh';

export default {
	siteName: 'LI DAMAO',
	siteTag: 'PHOTOGRAPHY',
	siteDescription:
		'李大毛の写真ポートフォリオ。訪れた場所をアルバムにまとめ、各写真に撮影データと位置情報を添えています。',
	nav: { albums: 'アルバム', map: '足跡', about: 'プロフィール' },
	langName: { zh: '中', ja: '日', en: 'EN' },
	langLabel: { zh: '中文', ja: '日本語', en: 'English' },
	switchLang: '言語を切り替える',
	mainNav: 'メインナビゲーション',
	hero: {
		latest: '最新アルバム',
		pinned: 'ピックアップ',
		enter: 'アルバムを見る',
		exif: 'カバー写真のデータ'
	},
	photos: '{n} 枚',
	albumsHeading: 'アルバム',
	albumsAll: 'すべてのアルバム',
	browseAll: 'すべてのアルバムを見る',
	shownOf: '{shown} / {total} 件を表示',
	mapHeading: '足跡',
	mapHint: '点はそれぞれアルバムです。クリックで開きます',
	footer: {
		about: 'プロフィール',
		intro: '旅先や街、自然をカメラで記録しています。ここには写真だけを置き、文章はブログに書いています。',
		blog: 'ブログ',
		rights: 'All rights reserved'
	},
	exif: {
		camera: 'カメラ',
		lens: 'レンズ',
		focal: '焦点距離',
		aperture: '絞り',
		shutter: 'シャッター',
		iso: 'ISO',
		size: 'サイズ'
	},
	album: {
		place: '場所',
		dates: '日付',
		count: '枚数',
		altitude: '標高',
		gear: '機材',
		info: 'アルバム情報',
		route: '撮影ルート',
		backAll: 'すべてのアルバム',
		next: '次のアルバム',
		fallback: 'このアルバムはまだ日本語に翻訳されていません。中国語の原文を表示しています。'
	},
	notFound: 'ページが見つかりません',
	backHome: 'トップへ戻る'
} satisfies typeof zh;

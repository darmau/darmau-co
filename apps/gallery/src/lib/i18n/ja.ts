import type zh from './zh';

export default {
	siteName: 'DARMAU',
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
	viewer: {
		back: 'アルバムに戻る',
		close: '閉じる',
		info: '写真の情報',
		prev: '前の写真',
		next: '次の写真',
		photoN: '{n} 枚目',
		filmstrip: 'このアルバムのすべての写真',
		taken: '撮影日時',
		params: '撮影データ',
		location: '撮影場所',
		lat: '緯度',
		lng: '経度',
		alt: '標高',
		ev: '露出補正',
		openMap: '地図で開く',
		noExif: 'この写真には撮影データがありません',
		shortcuts: '← → 移動 · I 情報 · Esc 閉じる'
	},
	notFound: 'ページが見つかりません',
	backHome: 'トップへ戻る'
} satisfies typeof zh;

import type zh from './zh';

export default {
	siteName: 'LI DAMAO',
	siteTag: 'PHOTOGRAPHY',
	siteDescription:
		'Photography by Li Damao. Albums from the places I have been, each frame with its full EXIF and location.',
	nav: { albums: 'Albums', map: 'Map', about: 'About' },
	langName: { zh: '中', ja: '日', en: 'EN' },
	langLabel: { zh: '中文', ja: '日本語', en: 'English' },
	switchLang: 'Switch language',
	mainNav: 'Main navigation',
	hero: {
		latest: 'Latest album',
		pinned: 'Featured album',
		enter: 'Enter album',
		exif: 'Cover EXIF'
	},
	photos: '{n} photos',
	albumsHeading: 'Albums',
	albumsAll: 'All albums',
	browseAll: 'Browse all albums',
	shownOf: 'Showing {shown} / {total}',
	mapHeading: 'Map',
	mapHint: 'Each dot is an album. Click to open',
	footer: {
		about: 'About',
		intro: 'Journeys, cities and landscapes, through a camera. Only pictures live here; the writing is on the blog.',
		blog: 'Blog',
		rights: 'All rights reserved'
	},
	exif: {
		camera: 'Camera',
		lens: 'Lens',
		focal: 'Focal',
		aperture: 'Aperture',
		shutter: 'Shutter',
		iso: 'ISO',
		size: 'Size'
	},
	album: {
		place: 'Location',
		dates: 'Dates',
		count: 'Photos',
		altitude: 'Altitude',
		gear: 'Gear',
		info: 'Album details',
		route: 'Route',
		backAll: 'All albums',
		next: 'Next album',
		fallback: 'This album has not been translated yet. Showing the Chinese original.'
	},
	notFound: 'Page not found',
	backHome: 'Back to home'
} satisfies typeof zh;

import type zh from './zh';

export default {
	siteName: 'DARMAU',
	siteTag: 'PHOTOGRAPHY',
	siteDescription:
		'Photography by DARMAU. Albums from the places I have been, each frame with its full EXIF and location.',
	nav: { albums: 'Albums', map: 'Map', about: 'About' },
	langName: { zh: '中', ja: '日', en: 'EN' },
	langLabel: { zh: '中文', ja: '日本語', en: 'English' },
	switchLang: 'Switch language',
	mainNav: 'Main navigation',
	hero: {
		latest: 'Latest album',
		pinned: 'Featured album',
		enter: 'Enter album',
		exif: 'Cover EXIF',
		carousel: 'Featured albums',
		slide: '{n} of {total}',
		goTo: 'Show featured album {n}',
		pause: 'Pause slideshow',
		play: 'Resume slideshow'
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
		route: 'Locations',
		backAll: 'All albums',
		next: 'Next album',
		fallback: 'This album has not been translated yet. Showing the Chinese original.'
	},
	viewer: {
		back: 'Back to album',
		close: 'Close',
		info: 'Photo details',
		prev: 'Previous photo',
		next: 'Next photo',
		photoN: 'Photo {n}',
		filmstrip: 'All photos in this album',
		taken: 'Taken',
		params: 'Exposure',
		location: 'Location',
		lat: 'Latitude',
		lng: 'Longitude',
		alt: 'Altitude',
		ev: 'Exposure comp.',
		openMap: 'Open in map',
		noExif: 'No EXIF recorded for this photo',
		shortcuts: '← → browse · I info · Esc close'
	},
	notFound: 'Page not found',
	backHome: 'Back to home'
} satisfies typeof zh;

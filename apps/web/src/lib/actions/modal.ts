import type { Action } from 'svelte/action';

const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * 模态浮层行为：焦点移入、Tab 循环、Escape 关闭、关闭后焦点还原、背景滚动锁定。
 * 移动端抽屉和相册灯箱原本都只是「视觉上盖住一切」的 div，键盘焦点会跑到背后
 * 看不见的元素上。这里补齐 headlessui Dialog 原本自带的那套行为。
 */
export const modal: Action<HTMLElement, () => void> = (node, callback) => {
	let onClose = callback;

	// 记住是谁打开的，关闭时把焦点还回去
	const opener = document.activeElement as HTMLElement | null;

	const focusable = () =>
		Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => el.offsetParent !== null || el === document.activeElement
		);

	const handleKey = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onClose();
			return;
		}

		if (event.key !== 'Tab') return;

		const items = focusable();
		if (items.length === 0) {
			event.preventDefault();
			return;
		}

		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;

		// 焦点跑到浮层外面（或还没进来）时，拉回边界元素
		if (!node.contains(active)) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
			return;
		}

		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};

	const previousOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';

	// 等浮层挂到 DOM 上（transition 起始帧）之后再移焦点
	const raf = requestAnimationFrame(() => {
		const items = focusable();
		(items[0] ?? node).focus();
	});

	document.addEventListener('keydown', handleKey, true);

	return {
		update: (next: () => void) => {
			onClose = next;
		},
		destroy: () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('keydown', handleKey, true);
			document.body.style.overflow = previousOverflow;
			opener?.focus?.();
		}
	};
};

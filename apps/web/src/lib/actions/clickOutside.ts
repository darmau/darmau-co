import type { Action } from 'svelte/action';

/**
 * 点击元素外部或按 Escape 时回调。用来替代 headlessui 的 Popover/Dialog 自带的关闭行为。
 */
export const clickOutside: Action<HTMLElement, () => void> = (node, callback) => {
	let onClose = callback;

	const handlePointer = (event: MouseEvent | TouchEvent) => {
		const target = event.target as Node | null;
		if (target && !node.contains(target)) onClose();
	};

	const handleKey = (event: KeyboardEvent) => {
		if (event.key === 'Escape') onClose();
	};

	// 用 capture：面板里的链接点击会先触发导航再冒泡，冒泡阶段监听可能收不到
	document.addEventListener('pointerdown', handlePointer, true);
	document.addEventListener('keydown', handleKey);

	return {
		update: (next: () => void) => {
			onClose = next;
		},
		destroy: () => {
			document.removeEventListener('pointerdown', handlePointer, true);
			document.removeEventListener('keydown', handleKey);
		}
	};
};

import type { Action } from 'svelte/action';

/**
 * 元素出现时把键盘焦点移过去。用于确认态这类「按钮被就地替换」的交互：
 * 不移焦点的话，触发按钮消失后焦点会掉回 body，键盘用户会丢失位置。
 * 传 false 可以跳过（比如只想在某一条记录上生效）。
 */
export const focusOnMount: Action<HTMLElement, boolean | undefined> = (node, enabled = true) => {
	if (enabled === false) return;

	// 等元素真正进入布局后再聚焦，否则 Safari 上可能聚焦失败
	const raf = requestAnimationFrame(() => node.focus());

	return {
		destroy: () => cancelAnimationFrame(raf)
	};
};

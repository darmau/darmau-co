import { createContext } from 'svelte';

/** 图片 CDN 前缀（IMG_PREFIX），由根 layout 设置 */
export const [getImgPrefix, setImgPrefix] = createContext<string>();

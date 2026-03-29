import type { ListNavigationAction } from './types.js';

export function clampSelectedIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) {
    return -1;
  }
  return Math.min(Math.max(index, 0), itemCount - 1);
}

export function moveSelectedIndex(
  currentIndex: number,
  itemCount: number,
  action: ListNavigationAction,
  pageSize = 5
): number {
  if (itemCount <= 0) {
    return -1;
  }
  const current = clampSelectedIndex(currentIndex, itemCount);
  switch (action) {
    case 'next':
      return Math.min(current + 1, itemCount - 1);
    case 'prev':
      return Math.max(current - 1, 0);
    case 'home':
      return 0;
    case 'end':
      return itemCount - 1;
    case 'page_down':
      return Math.min(current + Math.max(pageSize, 1), itemCount - 1);
    case 'page_up':
      return Math.max(current - Math.max(pageSize, 1), 0);
  }
}

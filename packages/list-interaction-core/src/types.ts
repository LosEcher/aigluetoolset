export type ListNavigationAction =
  | 'next'
  | 'prev'
  | 'home'
  | 'end'
  | 'page_up'
  | 'page_down';

export type KeyIntent =
  | { kind: 'navigate'; action: ListNavigationAction }
  | { kind: 'activate' }
  | { kind: 'close' }
  | { kind: 'none' };

export type EditableTargetSnapshot = {
  tagName?: string | null;
  isContentEditable?: boolean;
};

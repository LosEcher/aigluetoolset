import type { EditableTargetSnapshot, KeyIntent } from './types.js';

export function isEditableTarget(target: EditableTargetSnapshot | null | undefined): boolean {
  if (!target) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tagName = String(target.tagName ?? '').toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function deriveListKeyIntent(
  key: string,
  options: {
    inEditable?: boolean;
    isComposing?: boolean;
  } = {}
): KeyIntent {
  const inEditable = options.inEditable === true;
  switch (key) {
    case 'ArrowDown':
      return { kind: 'navigate', action: 'next' };
    case 'ArrowUp':
      return { kind: 'navigate', action: 'prev' };
    case 'Enter':
      if (options.isComposing) {
        return { kind: 'none' };
      }
      return { kind: 'activate' };
    case 'Escape':
      return { kind: 'close' };
    case 'Home':
      return inEditable ? { kind: 'none' } : { kind: 'navigate', action: 'home' };
    case 'End':
      return inEditable ? { kind: 'none' } : { kind: 'navigate', action: 'end' };
    case 'PageDown':
      return inEditable ? { kind: 'none' } : { kind: 'navigate', action: 'page_down' };
    case 'PageUp':
      return inEditable ? { kind: 'none' } : { kind: 'navigate', action: 'page_up' };
    default:
      return { kind: 'none' };
  }
}

import type { RefObject } from 'react';
import { useListKeyboard } from './useListKeyboard.js';
import { useSelectedItemAutoFocus } from './useSelectedItemAutoFocus.js';

export type UseManagedListKeyboardOptions = {
  containerRef: RefObject<HTMLElement | null>;
  selectedContainerRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
  itemCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate?: () => void;
  onClose?: () => void;
  pageSize?: number;
  scrollBehavior?: ScrollBehavior;
  selectedSelector?: string;
};

export function useManagedListKeyboard(options: UseManagedListKeyboardOptions) {
  useListKeyboard(options);
  useSelectedItemAutoFocus(options);
}

import { useEffect, useRef, type RefObject } from 'react';
import { deriveListKeyIntent, isEditableTarget, moveSelectedIndex } from '../../list-interaction-core/dist/index.js';

export type UseListKeyboardOptions = {
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  itemCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate?: () => void;
  onClose?: () => void;
  pageSize?: number;
};

export function useListKeyboard(options: UseListKeyboardOptions) {
  const {
    containerRef,
    enabled = true,
    itemCount,
    selectedIndex,
    onSelect,
    onActivate,
    onClose,
    pageSize = 5,
  } = options;

  const onSelectRef = useRef(onSelect);
  const onActivateRef = useRef(onActivate);
  const onCloseRef = useRef(onClose);
  const valuesRef = useRef({ itemCount, selectedIndex, pageSize });

  useEffect(() => {
    onSelectRef.current = onSelect;
    onActivateRef.current = onActivate;
    onCloseRef.current = onClose;
  }, [onSelect, onActivate, onClose]);

  useEffect(() => {
    valuesRef.current = { itemCount, selectedIndex, pageSize };
  }, [itemCount, selectedIndex, pageSize]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (!container.contains(activeElement)) {
        return;
      }
      const { itemCount: count, selectedIndex: current, pageSize: currentPageSize } = valuesRef.current;
      const inEditable = isEditableTarget({
        tagName: activeElement instanceof HTMLElement ? activeElement.tagName : null,
        isContentEditable: activeElement instanceof HTMLElement ? activeElement.isContentEditable : false,
      });
      const intent = deriveListKeyIntent(event.key, {
        inEditable,
        isComposing: event.isComposing,
      });
      if (intent.kind === 'none') {
        return;
      }
      event.preventDefault();
      if (intent.kind === 'activate') {
        onActivateRef.current?.();
        return;
      }
      if (intent.kind === 'close') {
        onCloseRef.current?.();
        return;
      }
      const nextIndex = moveSelectedIndex(current, count, intent.action, currentPageSize);
      if (nextIndex !== current && nextIndex >= 0) {
        onSelectRef.current(nextIndex);
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => container.removeEventListener('keydown', handleKeyDown, true);
  }, [containerRef, enabled]);
}

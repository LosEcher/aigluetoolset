import { useEffect, useRef, type RefObject } from 'react';

export type UseSelectedItemAutoFocusOptions = {
  containerRef: RefObject<HTMLElement | null>;
  selectedContainerRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
  itemCount: number;
  selectedIndex: number;
  selectedSelector?: string;
  scrollBehavior?: ScrollBehavior;
};

export function useSelectedItemAutoFocus(options: UseSelectedItemAutoFocusOptions) {
  const {
    containerRef,
    selectedContainerRef,
    enabled = true,
    itemCount,
    selectedIndex,
    selectedSelector = '[data-selected="true"]',
    scrollBehavior = 'smooth',
  } = options;

  const latestIndexRef = useRef(selectedIndex);
  useEffect(() => {
    latestIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (!enabled || itemCount <= 0) {
      return;
    }
    const currentIndex = Math.min(latestIndexRef.current, Math.max(itemCount - 1, 0));
    if (currentIndex < 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const container = selectedContainerRef?.current ?? containerRef.current;
      const selectedElement = container?.querySelector<HTMLElement>(selectedSelector);
      if (!selectedElement) {
        return;
      }
      if (container?.contains(document.activeElement)) {
        selectedElement.focus();
      }
      selectedElement.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
    });

    return () => cancelAnimationFrame(frame);
  }, [containerRef, selectedContainerRef, enabled, itemCount, scrollBehavior, selectedSelector, selectedIndex]);
}

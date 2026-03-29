import { useMemo } from 'react';
import { clampBlock, measureBlock, type MeasuredTextBlock, type TextBlockInput } from '@aigluetoolset/text-block-core';

export function useMeasuredTextBlock(input: TextBlockInput): MeasuredTextBlock {
  return useMemo(
    () => (input.lineClamp ? clampBlock(input) : measureBlock(input)),
    [input]
  );
}

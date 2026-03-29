import { useMemo } from 'react';
import { type TextBlockInput } from '@aigluetoolset/text-block-core';
import { predictBlockHeight } from '@aigluetoolset/text-block-predictor';

export function usePredictedRowHeight(input: TextBlockInput): number {
  return useMemo(() => predictBlockHeight(input).height, [input]);
}

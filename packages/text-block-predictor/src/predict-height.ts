import { buildTextBlockCacheKey, type TextBlockInput } from '@aigluetoolset/text-block-core';

export type PredictedTextBlockHeight = {
  height: number;
  estimatedLineCount: number;
  confidence: number;
  cacheKey: string;
};

export function predictBlockHeight(input: TextBlockInput): PredictedTextBlockHeight {
  const cacheKey = buildTextBlockCacheKey(input);
  const lineHeight = input.lineHeight ?? Math.round(input.fontSize * 1.5);
  const averageCharWidth = Math.max(1, input.fontSize * 0.56 + (input.letterSpacing ?? 0));
  const charsPerLine = Math.max(1, Math.floor(input.width / averageCharWidth));
  const normalizedLength = Math.max(0, input.text.trim().length);
  const estimatedLineCount = Math.max(1, Math.ceil(normalizedLength / charsPerLine));

  return {
    height: estimatedLineCount * lineHeight,
    estimatedLineCount,
    confidence: normalizedLength < 120 ? 0.82 : 0.67,
    cacheKey,
  };
}

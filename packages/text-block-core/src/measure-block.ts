import { buildTextBlockCacheKey } from './cache-key';
import { normalizeInputText, splitWords } from './unicode';
import type { MeasuredTextBlock, TextBlockInput, TextLine } from './types';

function approximateCharWidth(input: TextBlockInput): number {
  const base = Math.max(1, input.fontSize);
  return base * 0.56 + (input.letterSpacing ?? 0);
}

function approximateLineHeight(input: TextBlockInput): number {
  return input.lineHeight ?? Math.round(input.fontSize * 1.5);
}

export function measureBlock(input: TextBlockInput): MeasuredTextBlock {
  const normalizedText = normalizeInputText(input.text, input.whiteSpace ?? 'normal');
  const cacheKey = buildTextBlockCacheKey(input);
  const charWidth = approximateCharWidth(input);
  const lineHeight = approximateLineHeight(input);
  const maxCharsPerLine = Math.max(1, Math.floor(input.width / Math.max(1, charWidth)));
  const parts = splitWords(normalizedText);

  const lines: TextLine[] = [];
  let current = '';
  let lineStart = 0;
  let cursor = 0;

  const pushLine = (text: string, start: number, end: number) => {
    lines.push({
      start,
      end,
      text,
      width: Math.min(input.width, text.length * charWidth),
      top: lines.length * lineHeight,
      height: lineHeight,
    });
  };

  for (const part of parts) {
    const candidate = `${current}${part}`;
    if (candidate.length <= maxCharsPerLine || current.length === 0) {
      current = candidate;
      cursor += part.length;
      continue;
    }
    pushLine(current, lineStart, lineStart + current.length);
    lineStart += current.length;
    current = part.trimStart();
    cursor = lineStart + current.length;
  }

  if (current.length > 0 || lines.length === 0) {
    pushLine(current, lineStart, lineStart + current.length);
  }

  return {
    lines,
    width: input.width,
    height: lines.length * lineHeight,
    lineCount: lines.length,
    visibleText: normalizedText,
    truncated: false,
    overflowRange: null,
    cacheKey,
  };
}

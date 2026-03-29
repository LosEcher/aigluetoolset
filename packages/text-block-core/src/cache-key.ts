import type { TextBlockInput } from './types';

export function buildTextBlockCacheKey(input: TextBlockInput): string {
  return JSON.stringify({
    text: input.text,
    width: input.width,
    font: input.font,
    fontSize: input.fontSize,
    fontWeight: input.fontWeight ?? null,
    lineHeight: input.lineHeight ?? null,
    letterSpacing: input.letterSpacing ?? null,
    whiteSpace: input.whiteSpace ?? 'normal',
    overflowWrap: input.overflowWrap ?? 'break-word',
    wordBreak: input.wordBreak ?? 'normal',
    lineClamp: input.lineClamp ?? null,
    locale: input.locale ?? null,
  });
}

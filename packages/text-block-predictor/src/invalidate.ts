import { type TextBlockInput } from '@aigluetoolset/text-block-core';

export function shouldInvalidatePrediction(previous: TextBlockInput, next: TextBlockInput): boolean {
  return (
    previous.text !== next.text ||
    previous.width !== next.width ||
    previous.font !== next.font ||
    previous.fontSize !== next.fontSize ||
    previous.fontWeight !== next.fontWeight ||
    previous.lineHeight !== next.lineHeight ||
    previous.letterSpacing !== next.letterSpacing ||
    previous.whiteSpace !== next.whiteSpace ||
    previous.overflowWrap !== next.overflowWrap ||
    previous.wordBreak !== next.wordBreak ||
    previous.lineClamp !== next.lineClamp ||
    previous.locale !== next.locale
  );
}

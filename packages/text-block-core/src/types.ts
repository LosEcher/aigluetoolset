export type WhiteSpaceMode = 'normal' | 'pre-wrap';
export type OverflowWrapMode = 'normal' | 'break-word' | 'anywhere';
export type WordBreakMode = 'normal' | 'break-all';

export type TextBlockInput = {
  text: string;
  width: number;
  font: string;
  fontSize: number;
  fontWeight?: string | number;
  lineHeight?: number;
  letterSpacing?: number;
  whiteSpace?: WhiteSpaceMode;
  overflowWrap?: OverflowWrapMode;
  wordBreak?: WordBreakMode;
  lineClamp?: number | null;
  locale?: string;
};

export type TextLine = {
  start: number;
  end: number;
  text: string;
  width: number;
  top: number;
  height: number;
};

export type MeasuredTextBlock = {
  lines: TextLine[];
  width: number;
  height: number;
  lineCount: number;
  visibleText: string;
  truncated: boolean;
  overflowRange: [number, number] | null;
  cacheKey: string;
};

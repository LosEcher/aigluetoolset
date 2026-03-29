import { measureBlock } from './measure-block.js';
import type { MeasuredTextBlock, TextBlockInput } from './types.js';

export function clampBlock(input: TextBlockInput): MeasuredTextBlock {
  const measured = measureBlock(input);
  const lineClamp = input.lineClamp ?? null;

  if (!lineClamp || measured.lines.length <= lineClamp) {
    return measured;
  }

  const visibleLines = measured.lines.slice(0, lineClamp);
  const lastLine = visibleLines[visibleLines.length - 1];
  const visibleText = `${visibleLines.map((line) => line.text).join(' ').trimEnd()}...`;

  return {
    ...measured,
    lines: visibleLines,
    lineCount: visibleLines.length,
    height: visibleLines.reduce((sum, line) => sum + line.height, 0),
    visibleText,
    truncated: true,
    overflowRange: [lastLine.end, measured.visibleText.length],
  };
}

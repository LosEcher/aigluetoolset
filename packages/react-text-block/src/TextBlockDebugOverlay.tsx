import type { MeasuredTextBlock } from '@aigluetoolset/text-block-core';

type TextBlockDebugOverlayProps = {
  measured: MeasuredTextBlock;
};

export function TextBlockDebugOverlay({ measured }: TextBlockDebugOverlayProps) {
  return (
    <pre>
      {JSON.stringify(
        {
          lineCount: measured.lineCount,
          height: measured.height,
          truncated: measured.truncated,
          overflowRange: measured.overflowRange,
        },
        null,
        2
      )}
    </pre>
  );
}

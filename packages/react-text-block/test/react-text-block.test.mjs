import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';

import { TextBlockDebugOverlay, useMeasuredTextBlock, usePredictedRowHeight } from '../dist/index.js';

const originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;

test.beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

test.afterEach(() => {
  if (originalActEnvironment === undefined) {
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    return;
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
});

test('useMeasuredTextBlock returns measured lines and applies lineClamp when present', async () => {
  const captured = [];

  function Harness({ input }) {
    const measured = useMeasuredTextBlock(input);
    captured.push(measured);
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = create(
      React.createElement(Harness, {
        input: {
          text: 'Alpha beta gamma delta epsilon',
          width: 80,
          font: 'Inter',
          fontSize: 10,
        },
      })
    );
  });

  assert.equal(captured.at(-1).truncated, false);
  assert.ok(captured.at(-1).lineCount >= 2);

  await act(async () => {
    renderer.update(
      React.createElement(Harness, {
        input: {
          text: 'Alpha beta gamma delta epsilon',
          width: 80,
          font: 'Inter',
          fontSize: 10,
          lineClamp: 2,
        },
      })
    );
  });

  assert.equal(captured.at(-1).truncated, true);
  assert.equal(captured.at(-1).lineCount, 2);

  await act(async () => {
    renderer.unmount();
  });
});

test('usePredictedRowHeight returns predictor height from the input contract', async () => {
  const heights = [];

  function Harness({ input }) {
    const height = usePredictedRowHeight(input);
    heights.push(height);
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = create(
      React.createElement(Harness, {
        input: {
          text: 'Alpha beta gamma delta epsilon',
          width: 96,
          font: 'Inter',
          fontSize: 12,
        },
      })
    );
  });

  assert.equal(heights.at(-1), 54);

  await act(async () => {
    renderer.update(
      React.createElement(Harness, {
        input: {
          text: 'Alpha beta gamma delta epsilon zeta eta theta iota',
          width: 96,
          font: 'Inter',
          fontSize: 12,
        },
      })
    );
  });

  assert.ok(heights.at(-1) >= 54);

  await act(async () => {
    renderer.unmount();
  });
});

test('TextBlockDebugOverlay renders key measurement fields', async () => {
  let renderer;
  await act(async () => {
    renderer = create(
      React.createElement(TextBlockDebugOverlay, {
        measured: {
          lines: [],
          width: 80,
          height: 32,
          lineCount: 2,
          visibleText: 'Alpha beta',
          truncated: true,
          overflowRange: [12, 24],
          cacheKey: 'cache-key',
        },
      })
    );
  });

  const text = renderer.root.findByType('pre').children.join('');
  assert.match(text, /"lineCount": 2/);
  assert.match(text, /"height": 32/);
  assert.match(text, /"truncated": true/);
  assert.match(text, /"overflowRange": \[/);

  await act(async () => {
    renderer.unmount();
  });
});

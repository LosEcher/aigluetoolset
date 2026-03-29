import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTextBlockCacheKey,
  clampBlock,
  measureBlock,
  normalizeInputText,
  splitWords,
} from '../dist/index.js';

const baseInput = {
  text: 'Alpha beta gamma delta epsilon',
  width: 80,
  font: 'Inter',
  fontSize: 10,
};

test('normalizeInputText and splitWords handle whitespace modes', () => {
  assert.equal(normalizeInputText('  Alpha   beta \n gamma  '), 'Alpha beta gamma');
  assert.equal(normalizeInputText('a\r\nb', 'pre-wrap'), 'a\nb');
  assert.deepEqual(splitWords('Alpha beta'), ['Alpha', ' ', 'beta']);
  assert.deepEqual(splitWords(''), []);
});

test('buildTextBlockCacheKey captures stable layout inputs', () => {
  const key = buildTextBlockCacheKey({
    ...baseInput,
    lineClamp: 2,
    lineHeight: 18,
    locale: 'en-US',
  });

  assert.equal(
    key,
    JSON.stringify({
      text: 'Alpha beta gamma delta epsilon',
      width: 80,
      font: 'Inter',
      fontSize: 10,
      fontWeight: null,
      lineHeight: 18,
      letterSpacing: null,
      whiteSpace: 'normal',
      overflowWrap: 'break-word',
      wordBreak: 'normal',
      lineClamp: 2,
      locale: 'en-US',
    })
  );
});

test('measureBlock splits text into bounded lines with layout metadata', () => {
  const measured = measureBlock(baseInput);

  assert.equal(measured.width, 80);
  assert.equal(measured.truncated, false);
  assert.equal(measured.visibleText, 'Alpha beta gamma delta epsilon');
  assert.equal(measured.lineCount, measured.lines.length);
  assert.ok(measured.lines.length >= 2);
  assert.ok(measured.lines.every((line, index) => line.top === index * line.height));
  assert.ok(measured.lines.every((line) => line.width <= baseInput.width));
  assert.ok(measured.cacheKey.includes('"font":"Inter"'));
});

test('clampBlock truncates measured output when lineClamp is lower than measured line count', () => {
  const clamped = clampBlock({
    ...baseInput,
    lineClamp: 2,
  });

  assert.equal(clamped.truncated, true);
  assert.equal(clamped.lineCount, 2);
  assert.ok(clamped.visibleText.endsWith('...'));
  assert.ok(Array.isArray(clamped.overflowRange));
  assert.equal(clamped.height, clamped.lines.reduce((sum, line) => sum + line.height, 0));
});

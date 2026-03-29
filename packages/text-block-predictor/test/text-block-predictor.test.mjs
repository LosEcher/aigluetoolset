import test from 'node:test';
import assert from 'node:assert/strict';

import { SimpleLruMap, predictBlockHeight, shouldInvalidatePrediction } from '../dist/index.js';

const baseInput = {
  text: 'Alpha beta gamma delta epsilon zeta',
  width: 96,
  font: 'Inter',
  fontSize: 12,
};

test('predictBlockHeight returns cache key, confidence, and estimated line count', () => {
  const predicted = predictBlockHeight(baseInput);

  assert.ok(predicted.cacheKey.includes('"width":96'));
  assert.ok(predicted.estimatedLineCount >= 1);
  assert.equal(predicted.height, predicted.estimatedLineCount * Math.round(baseInput.fontSize * 1.5));
  assert.equal(predicted.confidence, 0.82);

  const longPrediction = predictBlockHeight({
    ...baseInput,
    text: 'x'.repeat(240),
  });
  assert.equal(longPrediction.confidence, 0.67);
});

test('shouldInvalidatePrediction tracks all structural text block inputs', () => {
  assert.equal(shouldInvalidatePrediction(baseInput, { ...baseInput }), false);
  assert.equal(shouldInvalidatePrediction(baseInput, { ...baseInput, width: 120 }), true);
  assert.equal(shouldInvalidatePrediction(baseInput, { ...baseInput, lineClamp: 2 }), true);
  assert.equal(shouldInvalidatePrediction(baseInput, { ...baseInput, locale: 'zh-CN' }), true);
});

test('SimpleLruMap updates recency and evicts oldest entries', () => {
  const map = new SimpleLruMap(2);
  map.set('a', 1);
  map.set('b', 2);
  assert.equal(map.get('a'), 1);
  map.set('c', 3);

  assert.equal(map.get('a'), 1);
  assert.equal(map.get('b'), undefined);
  assert.equal(map.get('c'), 3);
});

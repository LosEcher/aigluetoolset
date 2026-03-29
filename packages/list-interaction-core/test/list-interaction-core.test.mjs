import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampSelectedIndex,
  deriveListKeyIntent,
  isEditableTarget,
  moveSelectedIndex,
} from '../dist/index.js';

test('clampSelectedIndex handles empty, negative, and overflow values', () => {
  assert.equal(clampSelectedIndex(0, 0), -1);
  assert.equal(clampSelectedIndex(-4, 5), 0);
  assert.equal(clampSelectedIndex(2, 5), 2);
  assert.equal(clampSelectedIndex(9, 5), 4);
});

test('moveSelectedIndex respects navigation actions and page size', () => {
  assert.equal(moveSelectedIndex(-1, 5, 'next'), 1);
  assert.equal(moveSelectedIndex(0, 5, 'prev'), 0);
  assert.equal(moveSelectedIndex(1, 5, 'home'), 0);
  assert.equal(moveSelectedIndex(1, 5, 'end'), 4);
  assert.equal(moveSelectedIndex(1, 10, 'page_down', 3), 4);
  assert.equal(moveSelectedIndex(7, 10, 'page_up', 4), 3);
  assert.equal(moveSelectedIndex(2, 0, 'next'), -1);
});

test('isEditableTarget recognizes standard editable elements', () => {
  assert.equal(isEditableTarget(null), false);
  assert.equal(isEditableTarget({ tagName: 'div', isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: 'INPUT', isContentEditable: false }), true);
  assert.equal(isEditableTarget({ tagName: 'textarea', isContentEditable: false }), true);
  assert.equal(isEditableTarget({ tagName: 'button', isContentEditable: false }), false);
});

test('deriveListKeyIntent respects editable context and composition state', () => {
  assert.deepEqual(deriveListKeyIntent('ArrowDown'), { kind: 'navigate', action: 'next' });
  assert.deepEqual(deriveListKeyIntent('ArrowUp'), { kind: 'navigate', action: 'prev' });
  assert.deepEqual(deriveListKeyIntent('Enter'), { kind: 'activate' });
  assert.deepEqual(deriveListKeyIntent('Enter', { isComposing: true }), { kind: 'none' });
  assert.deepEqual(deriveListKeyIntent('Escape'), { kind: 'close' });
  assert.deepEqual(deriveListKeyIntent('Home', { inEditable: true }), { kind: 'none' });
  assert.deepEqual(deriveListKeyIntent('Home', { inEditable: false }), { kind: 'navigate', action: 'home' });
  assert.deepEqual(deriveListKeyIntent('PageDown', { inEditable: true }), { kind: 'none' });
  assert.deepEqual(deriveListKeyIntent('PageUp', { inEditable: false }), { kind: 'navigate', action: 'page_up' });
});

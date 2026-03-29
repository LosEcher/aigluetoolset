import test from 'node:test';
import assert from 'node:assert/strict';
import React, { createRef } from 'react';
import { act, create } from 'react-test-renderer';

import { useListKeyboard, useManagedListKeyboard, useSelectedItemAutoFocus } from '../dist/index.js';

class FakeHTMLElement {}

class FakeSelectableElement extends FakeHTMLElement {
  constructor() {
    super();
    this.focusCount = 0;
    this.scrollCalls = [];
  }

  focus() {
    this.focusCount += 1;
  }

  scrollIntoView(options) {
    this.scrollCalls.push(options);
  }
}

class FakeContainerElement extends FakeHTMLElement {
  constructor() {
    super();
    this.listeners = new Map();
    this.selectedElement = null;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) {
      this.listeners.delete(type);
    }
  }

  contains(target) {
    return target === globalThis.document.activeElement;
  }

  querySelector() {
    return this.selectedElement;
  }

  dispatchKeydown(event) {
    const listener = this.listeners.get('keydown');
    if (listener) {
      listener(event);
    }
  }
}

const originalHTMLElement = globalThis.HTMLElement;
const originalDocument = globalThis.document;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

function installDomStubs() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.document = {
    activeElement: null,
  };
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {};
}

function restoreDomStubs() {
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.HTMLElement = originalHTMLElement;
  globalThis.document = originalDocument;
  globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
}

test.beforeEach(() => {
  installDomStubs();
});

test.afterEach(() => {
  restoreDomStubs();
});

test('useListKeyboard reacts to navigation, activation, and close intents', async () => {
  const container = new FakeContainerElement();
  const activeElement = new FakeSelectableElement();
  globalThis.document.activeElement = activeElement;

  const selectedIndices = [];
  let activated = 0;
  let closed = 0;

  function Harness() {
    const containerRef = createRef();
    containerRef.current = container;
    useListKeyboard({
      containerRef,
      itemCount: 4,
      selectedIndex: 0,
      onSelect(index) {
        selectedIndices.push(index);
      },
      onActivate() {
        activated += 1;
      },
      onClose() {
        closed += 1;
      },
      pageSize: 2,
    });
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness));
  });

  const createEvent = (key, extra = {}) => ({
    key,
    isComposing: false,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
    ...extra,
  });

  const nextEvent = createEvent('ArrowDown');
  container.dispatchKeydown(nextEvent);
  assert.equal(nextEvent.prevented, true);
  assert.deepEqual(selectedIndices, [1]);

  const activateEvent = createEvent('Enter');
  container.dispatchKeydown(activateEvent);
  assert.equal(activated, 1);

  const composingEvent = createEvent('Enter', { isComposing: true });
  container.dispatchKeydown(composingEvent);
  assert.equal(activated, 1);

  const closeEvent = createEvent('Escape');
  container.dispatchKeydown(closeEvent);
  assert.equal(closed, 1);

  await act(async () => {
    renderer.unmount();
  });
});

test('useSelectedItemAutoFocus focuses and scrolls the selected element when active inside container', async () => {
  const container = new FakeContainerElement();
  const selectedElement = new FakeSelectableElement();
  container.selectedElement = selectedElement;
  globalThis.document.activeElement = selectedElement;

  function Harness() {
    const containerRef = createRef();
    containerRef.current = container;
    useSelectedItemAutoFocus({
      containerRef,
      itemCount: 3,
      selectedIndex: 1,
      scrollBehavior: 'auto',
    });
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness));
  });

  assert.equal(selectedElement.focusCount, 1);
  assert.deepEqual(selectedElement.scrollCalls, [{ block: 'nearest', behavior: 'auto' }]);

  await act(async () => {
    renderer.unmount();
  });
});

test('useManagedListKeyboard combines keyboard and autofocus behavior', async () => {
  const container = new FakeContainerElement();
  const selectedElement = new FakeSelectableElement();
  container.selectedElement = selectedElement;
  globalThis.document.activeElement = selectedElement;

  const selectedIndices = [];

  function Harness() {
    const containerRef = createRef();
    containerRef.current = container;
    useManagedListKeyboard({
      containerRef,
      itemCount: 5,
      selectedIndex: 1,
      onSelect(index) {
        selectedIndices.push(index);
      },
    });
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness));
  });

  const event = {
    key: 'ArrowDown',
    isComposing: false,
    preventDefault() {},
  };
  container.dispatchKeydown(event);

  assert.deepEqual(selectedIndices, [2]);
  assert.equal(selectedElement.focusCount, 1);

  await act(async () => {
    renderer.unmount();
  });
});

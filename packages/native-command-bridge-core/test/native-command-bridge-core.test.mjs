import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createNativeCommandBridge,
  normalizeNativeBridgeError,
} from '../dist/index.js';

test('invoke returns success with attempts and duration metadata', async () => {
  const bridge = createNativeCommandBridge({
    async invoke(command, payload) {
      assert.equal(command, 'get_status');
      assert.deepEqual(payload, { scope: 'local' });
      return { status: 'ok' };
    },
  });

  const result = await bridge.invoke({
    command: 'get_status',
    payload: { scope: 'local' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 1);
  assert.equal(typeof result.durationMs, 'number');
  if (result.ok) {
    assert.deepEqual(result.value, { status: 'ok' });
  }
});

test('invoke retries and eventually succeeds', async () => {
  let attempts = 0;
  const bridge = createNativeCommandBridge(
    {
      async invoke() {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error('temporary failure');
          error.name = 'TemporaryError';
          throw error;
        }
        return { ok: true };
      },
    },
    { defaultRetries: 2 }
  );

  const result = await bridge.invoke({ command: 'sync_now' });
  assert.equal(result.ok, true);
  assert.equal(result.attempts, 3);
});

test('invoke surfaces timeout as normalized failure', async () => {
  const bridge = createNativeCommandBridge({
    async invoke() {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return { late: true };
    },
  });

  const result = await bridge.invoke({ command: 'slow_command', timeoutMs: 5 });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, 'TIMEOUT');
    assert.match(result.message, /slow_command/);
  }
});

test('subscribe reports unsupported transport clearly', async () => {
  const bridge = createNativeCommandBridge({
    async invoke() {
      return null;
    },
  });

  const result = await bridge.subscribe('clipboard-update', () => {});
  assert.deepEqual(result, {
    ok: false,
    code: 'UNSUPPORTED_SUBSCRIPTION',
    message: 'The current native bridge transport does not support event subscriptions',
  });
});

test('subscribe returns a dispose function when transport supports events', async () => {
  let disposed = 0;
  const bridge = createNativeCommandBridge({
    async invoke() {
      return null;
    },
    subscribe(_eventName, listener) {
      listener({ id: 1 });
      return () => {
        disposed += 1;
      };
    },
  });

  const result = await bridge.subscribe('clipboard-update', () => {});
  assert.equal(result.ok, true);
  if (result.ok) {
    result.dispose();
  }
  assert.equal(disposed, 1);
});

test('normalizeNativeBridgeError keeps structured code and details when present', () => {
  const result = normalizeNativeBridgeError({
    code: 'PermissionDenied',
    message: 'Need access',
    retryable: false,
    details: { scope: 'clipboard' },
  });

  assert.deepEqual(result, {
    ok: false,
    code: 'PERMISSION_DENIED',
    message: 'Need access',
    retryable: false,
    details: { scope: 'clipboard' },
    attempts: 1,
    durationMs: 0,
  });
});

import { normalizeNativeBridgeError, timeoutNativeBridgeFailure } from './errors.js';
import type {
  NativeBridgeCapabilities,
  NativeBridgeFailure,
  NativeBridgeRequest,
  NativeBridgeResult,
  NativeBridgeSubscribeResult,
  NativeBridgeTransport,
  NativeCommandBridge,
  NativeCommandBridgeOptions,
} from './types.js';

function withAttemptsAndDuration(
  failure: NativeBridgeFailure,
  attempts: number,
  durationMs: number
): NativeBridgeFailure {
  return {
    ...failure,
    attempts,
    durationMs,
  };
}

export function createNativeCommandBridge(
  transport: NativeBridgeTransport,
  options: NativeCommandBridgeOptions = {}
): NativeCommandBridge {
  const {
    defaultTimeoutMs = 30_000,
    defaultRetries = 0,
    shouldRetry,
    now = () => Date.now(),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  } = options;

  const capabilities: NativeBridgeCapabilities = {
    subscribe: Boolean(transport.subscribe),
    timeout: true,
    retries: true,
    ...transport.capabilities,
  };

  async function invoke<TInput, TOutput>(request: NativeBridgeRequest<TInput>): Promise<NativeBridgeResult<TOutput>> {
    const command = String(request.command || '').trim();
    if (!command) {
      return {
        ok: false,
        code: 'INVALID_REQUEST',
        message: 'Native bridge request requires a non-empty command',
        attempts: 0,
        durationMs: 0,
      };
    }

    const timeoutMs = request.timeoutMs ?? defaultTimeoutMs;
    const retries = request.retries ?? defaultRetries;
    let attempts = 0;
    const startedAt = now();

    while (true) {
      attempts += 1;
      let timeoutHandle: ReturnType<typeof setTimeoutFn> | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeoutFn(() => reject(timeoutNativeBridgeFailure(command, timeoutMs)), timeoutMs);
        });

        const value = await Promise.race([
          transport.invoke<TInput, TOutput>(command, request.payload),
          timeoutPromise,
        ]);

        if (timeoutHandle) {
          clearTimeoutFn(timeoutHandle);
        }

        return {
          ok: true,
          value,
          attempts,
          durationMs: now() - startedAt,
        };
      } catch (error) {
        if (timeoutHandle) {
          clearTimeoutFn(timeoutHandle);
        }

        const normalized = withAttemptsAndDuration(
          normalizeNativeBridgeError(error, 'NATIVE_BRIDGE_ERROR'),
          attempts,
          now() - startedAt
        );
        const canRetry = attempts <= retries;
        const retryDecision = canRetry
          ? shouldRetry
            ? await shouldRetry({ attempt: attempts, request, failure: normalized })
            : true
          : false;
        if (!retryDecision) {
          return normalized;
        }
      }
    }
  }

  async function subscribe<TEvent>(
    eventName: string,
    listener: (event: TEvent) => void
  ): Promise<NativeBridgeSubscribeResult> {
    const name = String(eventName || '').trim();
    if (!name) {
      return {
        ok: false,
        code: 'INVALID_REQUEST',
        message: 'Native bridge subscription requires a non-empty event name',
      };
    }
    if (!transport.subscribe) {
      return {
        ok: false,
        code: 'UNSUPPORTED_SUBSCRIPTION',
        message: 'The current native bridge transport does not support event subscriptions',
      };
    }
    try {
      const dispose = await transport.subscribe(name, listener);
      return {
        ok: true,
        dispose,
      };
    } catch (error) {
      const normalized = normalizeNativeBridgeError(error, 'NATIVE_BRIDGE_SUBSCRIBE_ERROR');
      return {
        ok: false,
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      };
    }
  }

  return {
    invoke,
    subscribe,
    getCapabilities() {
      return { ...capabilities };
    },
  };
}

import type { NativeBridgeFailure } from './types.js';

function toErrorCode(value: string): string {
  const normalized = String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || 'UNKNOWN_ERROR';
}

export function normalizeNativeBridgeError(error: unknown, fallbackCode = 'UNKNOWN_ERROR'): NativeBridgeFailure {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === 'string' ? toErrorCode(record.code) : undefined;
    const message =
      typeof record.message === 'string'
        ? record.message
        : error instanceof Error
          ? error.message
          : String(error);
    return {
      ok: false,
      code: code ?? (error instanceof Error ? toErrorCode(error.name) : fallbackCode),
      message,
      retryable: typeof record.retryable === 'boolean' ? record.retryable : undefined,
      details: 'details' in record ? record.details : undefined,
      attempts: 1,
      durationMs: 0,
    };
  }

  if (error instanceof Error) {
    return {
      ok: false,
      code: toErrorCode(error.name),
      message: error.message,
      attempts: 1,
      durationMs: 0,
    };
  }

  return {
    ok: false,
    code: fallbackCode,
    message: String(error),
    attempts: 1,
    durationMs: 0,
  };
}

export function timeoutNativeBridgeFailure(command: string, timeoutMs: number): NativeBridgeFailure {
  return {
    ok: false,
    code: 'TIMEOUT',
    message: `Command ${command} timed out after ${timeoutMs}ms`,
    retryable: true,
    attempts: 1,
    durationMs: timeoutMs,
  };
}

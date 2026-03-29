export type NativeBridgeRequest<TInput = unknown> = {
  command: string;
  payload?: TInput;
  timeoutMs?: number;
  retries?: number;
};

export type NativeBridgeSuccess<TOutput> = {
  ok: true;
  value: TOutput;
  attempts: number;
  durationMs: number;
};

export type NativeBridgeFailure = {
  ok: false;
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
  attempts: number;
  durationMs: number;
};

export type NativeBridgeResult<TOutput> = NativeBridgeSuccess<TOutput> | NativeBridgeFailure;

export type NativeBridgeEventListener<TEvent> = (event: TEvent) => void;

export type NativeBridgeSubscribeSuccess = {
  ok: true;
  dispose: () => void;
};

export type NativeBridgeSubscribeFailure = {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
};

export type NativeBridgeSubscribeResult = NativeBridgeSubscribeSuccess | NativeBridgeSubscribeFailure;

export type NativeBridgeCapabilities = {
  subscribe: boolean;
  timeout: boolean;
  retries: boolean;
};

export type NativeBridgeTransport = {
  invoke: <TInput, TOutput>(command: string, payload?: TInput) => Promise<TOutput>;
  subscribe?: <TEvent>(eventName: string, listener: NativeBridgeEventListener<TEvent>) => Promise<() => void> | (() => void);
  capabilities?: Partial<NativeBridgeCapabilities>;
};

export type NativeBridgeRetryContext = {
  attempt: number;
  request: NativeBridgeRequest;
  failure: NativeBridgeFailure;
};

export type NativeCommandBridgeOptions = {
  defaultTimeoutMs?: number;
  defaultRetries?: number;
  shouldRetry?: (context: NativeBridgeRetryContext) => boolean | Promise<boolean>;
  now?: () => number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
};

export type NativeCommandBridge = {
  invoke: <TInput, TOutput>(request: NativeBridgeRequest<TInput>) => Promise<NativeBridgeResult<TOutput>>;
  subscribe: <TEvent>(eventName: string, listener: NativeBridgeEventListener<TEvent>) => Promise<NativeBridgeSubscribeResult>;
  getCapabilities: () => NativeBridgeCapabilities;
};

# Native Command Bridge Boundary

## Goal

Define the extraction boundary for a future `native-command-bridge-core`
without starting the package too early.

This document exists so `cantool` structure cleanup and package extraction can proceed separately:

- `cantool` can continue refining its local folder layout and product wiring
- `aigluetoolset` can freeze the reusable bridge contract first

## Why This Is Not The Next Immediate Package

`native-command-bridge-core` is not blocked on build quality anymore.
It is blocked on boundary quality.

Right now the repository already has:

- tested `lsclaw-target-*` tooling
- tested `palette-core`
- tested `list-interaction-core`
- tested `react-list-interaction`
- tested `text-block-*`

The missing piece is not another package name.
The missing piece is a stable answer to:

- what is truly reusable across hosts
- what still belongs to `cantool`
- what error/result contract should be normalized

## What The Core Should Own

The future core package should own only host-agnostic bridge semantics:

- request/response invocation contract
- timeout handling
- retry policy hooks
- normalized error shape
- event subscription lifecycle
- cancellation / dispose semantics
- transport capability flags

Suggested public contract:

```ts
type NativeBridgeRequest<TInput> = {
  command: string;
  payload?: TInput;
  timeoutMs?: number;
};

type NativeBridgeSuccess<TOutput> = {
  ok: true;
  value: TOutput;
};

type NativeBridgeFailure = {
  ok: false;
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
};

type NativeBridgeResult<TOutput> = NativeBridgeSuccess<TOutput> | NativeBridgeFailure;

interface NativeCommandBridge {
  invoke<TInput, TOutput>(request: NativeBridgeRequest<TInput>): Promise<NativeBridgeResult<TOutput>>;
  subscribe<TEvent>(eventName: string, listener: (event: TEvent) => void): () => void;
}
```

## What Must Stay Out Of The Core

Do not pull these into the core package:

- concrete Tauri command names
- `cantool` product state or stores
- panel-specific toasts and UI copy
- plugin management flows
- launcher-level command routing
- product config files
- React hooks that assume `cantool` panel lifecycle

Those belong in:

- `cantool` product code
- a future Tauri adapter package
- a future React adapter package

## Proposed Package Split

When extraction starts, prefer:

1. `packages/native-command-bridge-core`
2. later `packages/tauri-command-bridge`
3. later `packages/react-native-command-bridge`

That split keeps the public contract reusable for:

- Tauri
- Electron
- browser extension background/content messaging
- local HTTP-backed desktop helpers
- worker/RPC adapters

## Minimum Extraction Inputs From CanTool

Before starting the package, collect these from `cantool`:

- current `invoke` wrapper entrypoints
- timeout and retry rules
- event subscription wrapper
- normalized success/error envelope shape
- all places where product UI currently depends on bridge-specific error wording

The goal is to extract only the overlap, not the full current implementation.

## Extraction Gate

Do not start `native-command-bridge-core` until all three are true:

1. `cantool` folder structure pass is done enough to identify the real bridge entrypoints
2. the reusable error/result shape is frozen in a doc or notes file
3. the first consumer is identified as a headless adoption target rather than a product shell transplant

## First Adoption Target

The first adoption target should be small and headless:

- one `invoke` wrapper
- one event subscription wrapper
- one normalized error/result mapper

Avoid starting with:

- full panel wiring
- settings UI
- plugin installation flows
- desktop app bootstrapping

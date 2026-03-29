# CanTool Bridge Adoption Sequence

## Goal

Freeze the smallest realistic adoption path from `cantool` into
`@aigluetoolset/native-command-bridge-core`.

This document exists because the current blocker is no longer extraction.
The blocker is `cantool`'s local bridge layering.

## Current CanTool Bridge Layers

The current frontend bridge surface is split across three places:

1. `frontend/src/lib/tauri.ts`
   - shared invoke wrapper
   - timeout / retry
   - error normalization
   - event subscribe helpers

2. `frontend/src/hooks/useTauri.ts`
   - window-level Tauri access
   - app-store metrics / invoke recording
   - result-wrapper shape

3. `frontend/src/hooks/useValidatedInvoke.ts`
   - request / response Zod validation
   - toast-facing error presentation

This means `cantool` currently has:

- one reusable transport wrapper
- one app-bound invoke hook
- one schema-validation hook

Only the first of those is a good extraction target.

## What Is Already Extracted

`@aigluetoolset/native-command-bridge-core` now owns the headless contract for:

- invoke request shape
- invoke success/failure result shape
- timeout handling
- retry handling
- normalized errors
- event subscription lifecycle
- transport capability flags

It does **not** own:

- Tauri command names
- `window.__TAURI__` access
- Zustand metrics recording
- toast copy
- Zod schemas

## What CanTool Should Fix Before Using The New Core

### 1. Make `frontend/src/lib/tauri.ts` the single transport wrapper

`useTauri.ts` should stop re-implementing direct `window.__TAURI__` lookup.

Instead:

- `frontend/src/lib/tauri.ts` should become the only transport-facing module
- `useTauri.ts` should depend on that module for invoke execution
- `useValidatedInvoke.ts` should remain above the transport layer

### 2. Keep validation and presentation out of the core

`useValidatedInvoke.ts` should stay local to `cantool`.

It is a product-facing layer because it owns:

- Zod request/response validation
- toast behavior
- UI wording

That should wrap the extracted bridge, not move into `aigluetoolset`.

### 3. Delay event-adapter extraction until one consumer is stable

`native-command-bridge-core` already supports `subscribe`.
Do not immediately start `tauri-command-bridge` until `cantool` has:

- one stable event wrapper in `frontend/src/lib/tauri.ts`
- one adoption path that proves the event contract shape is stable

## Recommended Adoption Order In CanTool

1. Replace `useTauri.ts` direct invoke access with a dependency on `frontend/src/lib/tauri.ts`
2. Keep `useValidatedInvoke.ts` as the schema/presentation wrapper above it
3. After that cleanup, add a thin local adapter that maps the Tauri API to
   `NativeBridgeTransport`
4. Only then decide whether `tauri-command-bridge` deserves its own package

## What Not To Do Next

Do not:

- move `useValidatedInvoke.ts` into `aigluetoolset`
- move toast behavior into the bridge package
- move command enums or generated API types into the bridge package
- extract panel-specific command helpers before the transport layer is unified

## Readiness Gate For The Next Package

Do not create `packages/tauri-command-bridge` until all three are true:

1. `cantool` uses one shared transport wrapper
2. `useTauri.ts` no longer bypasses that wrapper
3. one real frontend consumer has adopted the new bridge core without widening product state concerns

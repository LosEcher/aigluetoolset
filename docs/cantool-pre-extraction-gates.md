# CanTool Pre-Extraction Gates

## Goal

Freeze the concrete blockers that should be resolved in `cantool`
before more package extraction continues in `aigluetoolset`.

This document is intentionally about **readiness gates**, not package design.

## Gate 1: Unify The Frontend Tauri Boundary

Current `cantool` frontend transport truth is split across:

- `frontend/src/lib/tauri.ts`
- `frontend/src/hooks/useTauri.ts`
- `frontend/src/hooks/useValidatedInvoke.ts`

Readiness requirement:

1. `frontend/src/lib/tauri.ts` becomes the single transport wrapper
2. `useTauri.ts` stops bypassing it with direct `window.__TAURI__` access
3. `useValidatedInvoke.ts` stays above the transport layer as a local validation/presentation wrapper

Why this matters:

- more extraction right now would export dead or parallel abstractions
- the extracted bridge core should mirror one stable transport contract, not three competing ones

## Gate 2: Do Not Extract App-Shaped Hooks And Panels

These surfaces are still product-shaped and should be decomposed inside `cantool` first:

- `frontend/src/panels/SyncPanel.tsx`
- `frontend/src/hooks/useSync.ts`
- `frontend/src/panels/ClipboardPanel.tsx`
- `frontend/src/hooks/useClipboard.ts`
- `frontend/src/panels/SnippetsPanel.tsx`
- `frontend/src/hooks/useSettings.ts`
- `frontend/src/hooks/useAI.ts`
- `frontend/src/hooks/useASR.ts`

Readiness requirement:

- split transport/polling/error-policy/UI-state concerns before extracting anything from those flows

Safer extraction candidates remain the already narrower leaves, for example:

- `frontend/src/panels/settings/ai/`
- `frontend/src/hooks/useKeyboard.ts`
- `frontend/src/hooks/usePanelKeyboard.ts`
- `frontend/src/hooks/useManagementListKeyboard.ts`
- `frontend/src/hooks/useTimeFormat.ts`
- `frontend/src/hooks/useTtsPlayback.ts`
- `frontend/src/hooks/useTtsResources.ts`

## Gate 3: Pick One Type Generation Contract

Current state is split:

- `frontend/src/types/tauri.d.ts` is a handwritten command map
- `frontend/src/types/generated/api.ts` is generated
- legacy scripts and docs still disagree on whether generation is active or deprecated

Readiness requirement:

1. decide whether generated API types are the real contract
2. archive or remove legacy generation paths if they are no longer authoritative
3. stop documenting both pipelines as current

Do not extract command-bridge helpers until this is explicit.

## Gate 4: Reduce Root Documentation Noise

`cantool` currently keeps many analysis and plan files at repo root.

Examples:

- `DOCUMENTATION_ANALYSIS_REPORT.md`
- `SETTINGS_INVENTORY.md`
- `ASYNC_RUNTIME_FIX_PLAN.md`
- `FINDINGS_AND_ANALYSIS.md`
- `DEVELOPMENT_PLAN.md`

Readiness requirement:

1. keep root docs limited to current operator/developer entrypoints
2. move analysis/history artifacts under `docs/archive/root/` or another explicit archive location
3. keep `TODO.md` as active execution truth

This matters because extraction work should not treat root-level analysis artifacts as package inputs.

## Gate 5: Freeze Versioning And Release Truth

Current versioning/release truth is still inconsistent:

- release docs point to `dist/release-manifest-*.json`
- scripts write release outputs under `artifacts/`
- dev/build/release scripts generate different alpha suffix formats
- rollback docs still describe `dist/` as the source of truth

Readiness requirement:

1. pick one artifact directory as the release truth
2. align release docs with the real output path
3. normalize version suffix generation rules before exporting them into shared tooling

Do not carry current release/version drift into `aigluetoolset`.

## Gate 6: Archive Stale Analysis Before Using It As Design Input

Some `cantool` analysis docs are already stale against the scripts/code.

Readiness requirement:

1. archive or rewrite stale analysis docs
2. keep current docs/index and cleanup docs aligned with the actual scripts

This prevents extraction from being planned against already-invalid repo narratives.

## What Can Continue In Aigluetoolset Right Now

These are still safe:

- maintain and test `native-command-bridge-core`
- maintain and test the already extracted `palette-core` / `list-interaction-core` / `react-list-interaction`
- document adoption sequence and package boundaries

These should wait:

- `tauri-command-bridge`
- `react-native-command-bridge`
- extraction from app-shaped `cantool` panels and composite hooks

# lsclaw × cantool Tooling Plan

## Goal

This note answers two adjacent but different questions:

1. How `lsclaw` should drive target-project iteration with:
   - Kimi implementing
   - Codex reviewing and closing out
   - a reusable tool layer living in `aigluetoolset`
2. How common reusable parts from `cantool` should be extracted into `aigluetoolset`
   without collapsing unrelated runtime concerns into one package family.

The key decision is:

- keep `aigluetoolset` as an umbrella for **small reusable glue layers**
- do **not** merge `lsclaw orchestration tooling` and `cantool UI/runtime primitives` into one package
- do **not** widen the current text-block packages just because both efforts live in the same repo

## Executive Summary

### Track A: `lsclaw` target-project iteration tooling

This track should produce a small tool layer that helps a target repo become
`lsclaw`-dispatchable with a stable:

- frozen scope manifest
- verify-command manifest
- child-task template
- Kimi-implement / Codex-review execution contract

This is primarily **orchestration tooling**, not a runtime library.

Recommended package family:

- `packages/lsclaw-target-contract`
- `packages/lsclaw-target-cli`

### Track B: `cantool` extraction

This track should produce headless reusable primitives from `cantool`, but only where the abstraction is already real.

Recommended extraction order:

1. `palette-core`
2. `list-interaction-core`
3. `react-list-interaction`
4. `native-command-bridge-core`
5. later: `react-panel-shell`
6. later: `tool-card-core`

Current implementation status:

- `packages/lsclaw-target-contract` is in place
- `packages/lsclaw-target-cli` currently supports `init`, `freeze-slice`, `task-run`, `review-bundle`, and `verify`
- `packages/palette-core` is now the first landed `cantool` extraction target
- `packages/list-interaction-core` now carries headless selected-index and IME-safe key intent primitives from `cantool`

This is primarily **product runtime extraction**, not orchestration tooling.

## Principle: Keep The Two Tracks Separate

The temptation will be to create one generic package family like:

- `workflow-core`
- `agent-runtime`
- `ui-runtime`

That would be too early.

Right now there are two different kinds of reuse:

1. `lsclaw` needs a **target-repo onboarding and dispatch contract**
2. `cantool` offers **headless frontend/runtime primitives**

Those should share the repo, not the package boundary.

## Part 1: lsclaw -> Target Project -> Kimi Implement, Codex Review

## Desired Operator Flow

For a target repo such as `aigluetoolset`, the desired path is:

1. freeze a narrow slice in the target repo
2. generate a stable child-task contract
3. dispatch from `lsclaw`
4. let Kimi implement only inside the frozen slice
5. let Codex review and decide closeout
6. if needed, route fixes back to Kimi
7. finish with Codex closeout

This matches the existing direction already documented in:

- `docs/lsclaw-kimi-rollout.md`
- `docs/lsclaw-plan-installation.md`

The missing piece is not another plan draft.
The missing piece is the **target-repo tool layer** that makes frozen scope and verify entry explicit.

## What The Tool Layer Should Own

The `aigluetoolset` tool layer should own four things.

### 1. Target manifest

Each target repo should be able to declare a stable manifest, for example:

```json
{
  "schema": "aigluetoolset.lsclaw-target.v1",
  "repoId": "aigluetoolset",
  "defaultPlanId": "kimi-implement-codex-review",
  "defaultTargetProjectPath": "/abs/path/to/repo",
  "verify": {
    "defaultCommands": [
      "pnpm typecheck",
      "pnpm test"
    ]
  },
  "slices": {
    "text-block-v0": {
      "allowedScope": [
        "packages/text-block-core/src",
        "packages/text-block-predictor/src",
        "packages/react-text-block/src",
        "docs"
      ],
      "verifyCommands": [
        "pnpm typecheck",
        "pnpm test"
      ]
    }
  }
}
```

Suggested location:

- `.aigluetoolset/lsclaw-target.json`

This manifest is more important than free-form task prose.

### 2. Frozen slice documents

Each real iteration slice should have a narrow, file-backed contract.

Suggested location:

- `.aigluetoolset/slices/<slice-id>.md`

Example contents:

- objective
- in-scope files
- out-of-scope files
- verify commands
- expected artifacts
- stop conditions
- review owner

This should be the main input to `lsclaw`, not an operator-written paragraph every round.

### 3. Task-run request generation

The tool layer should generate the actual `/api/tasks/run` request payload from the manifest + slice file.

That means:

- resolve `targetProjectPath`
- resolve `planPath`
- inject `allowedScope`
- inject `verifyCommands`
- inject `ownerRepo`
- generate a bounded child task body

This should be done by CLI, not by manually editing JSON templates every time.

### 4. Review bundle generation

After Kimi implementation finishes, the tool layer should be able to generate a compact Codex review bundle:

- slice contract
- changed files
- verify results
- expected artifacts
- unresolved findings

This bundle should be small and deterministic enough that Codex review is about correctness and boundaries, not reconstruction.

## Recommended Packages

### `packages/lsclaw-target-contract`

Owns:

- manifest schemas
- slice contract types
- validation helpers
- task payload builder
- review bundle builder

Does not own:

- network transport
- local lsclaw service startup
- repo-specific UI code

### `packages/lsclaw-target-cli`

Owns:

- `init`
- `freeze-slice`
- `task-run`
- `review-bundle`
- `verify`

Suggested commands:

```bash
pnpm aiglue lsclaw:init
pnpm aiglue lsclaw:freeze-slice text-block-v0
pnpm aiglue lsclaw:task-run text-block-v0
pnpm aiglue lsclaw:review-bundle text-block-v0
pnpm aiglue lsclaw:verify text-block-v0
```

Write safety and recovery baseline:

- `init` writes only under repo-local `.aigluetoolset/`
- `freeze-slice` writes a new repo-local slice JSON file and updates the manifest with a relative path entry
- `task-run` and `review-bundle` default to stdout and only write files when `--output` is explicit
- `verify` executes inside the declared `targetProjectPath` and returns structured pass/fail results
- output paths outside the repo root are blocked unless the operator passes `--allow-outside-repo`
- overwrite writes require `--force`
- overwrite writes keep a timestamped `.bak-*` file for rollback
- temporary `.tmp-*` files are cleaned automatically after successful or failed writes
- fresh repos must run `init` first; otherwise `task-run` / `review-bundle` fail with explicit `manifest_not_found` / `slice_not_found`

## Recommended Short-Term Shape

Do not start with a full CLI framework.

Short-term implementation should be:

1. schema + manifest JSON
2. one slice markdown contract
3. one small task-run payload generator
4. one review-bundle generator

That is enough to support:

- target repo scaffolding
- Kimi implementation rounds
- Codex review rounds

## What Should Stay In lsclaw, Not In aigluetoolset

Keep these inside `lsclaw`:

- actual team plan runtime
- queue/dispatch state
- reviewer stage execution
- runtime supervision
- continuation steering

`aigluetoolset` should help **prepare** and **normalize** the target-repo side, not duplicate orchestration.

## Part 2: Extracting Common Pieces From cantool

## Main Decision

Do not treat `cantool` as a source for one giant reusable desktop framework.

Use it as a source for **narrow headless primitives** where the current implementation is already generic in spirit.

The best current candidates are exactly the ones already visible in `docs/cantool-extraction-notes.md`:

- command composition and ranking
- keyboard-driven list interaction
- panel shell patterns
- config-driven tool card execution
- typed command bridge

## Recommended Extraction Order

### Phase 1: `palette-core`

Extract from:

- `frontend/src/hooks/useCommands.ts`
- `frontend/src/stores/commandStore.ts`

Own:

- `CommandItem`
- `CommandSource`
- usage stats
- ranking
- filtering
- composition

Do not own:

- `clipboard`, `ocr`, `team`, `ai` ids
- Tauri assumptions
- panel rendering

Suggested package:

- `packages/palette-core`

### Phase 2: `list-interaction-core`

Extract from:

- `frontend/src/hooks/usePanelKeyboard.ts`
- `frontend/src/hooks/useManagementListKeyboard.ts`
- `frontend/src/hooks/useKeyboard.ts`

Own:

- selected-index reducer/controller
- arrow/home/end/page navigation
- IME-safe activate behavior
- close behavior
- optional scroll/focus adapters

Suggested packages:

- `packages/list-interaction-core`
- `packages/react-list-interaction`

This is likely the best first real extraction after `palette-core`.

### Phase 3: `native-command-bridge-core`

Extract from:

- `frontend/src/lib/tauri.ts`
- later optionally `frontend/src/hooks/useTauri.ts`

Own:

- request/response envelope
- timeout policy
- retry policy
- normalized error shape
- subscription contract

Do not make public API Tauri-only.

Better split:

- core: generic invoke/listen bridge contract
- adapter: Tauri implementation

Suggested packages:

- `packages/native-command-bridge-core`
- later: `packages/tauri-command-bridge-adapter`
- later: `packages/react-native-command-bridge`

### Phase 4: `react-panel-shell`

Extract only after the previous phases are stable.

Why later:

- panel shell is visually and product-wise easier to overfit
- it needs stable slot boundaries first

Suggested package:

- `packages/react-panel-shell`

### Deferred

These are valid later, but should not be the first extraction:

- `tool-card-core`
- `plugin-command-registry`

They depend on a clearer split between generic execution lifecycle and `cantool` product semantics.

## What Not To Extract Yet

Do not extract these now:

- Tauri command names
- `cantool` config schema
- AI feature ids and product-specific quick actions
- sync/team/governance business flows
- app-wide styling and panel visuals

If these move too early, `aigluetoolset` becomes a copy of `cantool`, not a reusable toolset.

## How aigluetoolset Should Be Organized

The repo should explicitly admit it now has multiple package families.

Recommended package families:

```text
packages/
  text-block-core/
  text-block-predictor/
  react-text-block/

  lsclaw-target-contract/
  lsclaw-target-cli/

  palette-core/
  list-interaction-core/
  react-list-interaction/
  native-command-bridge-core/
```

Important:

- do not rename the current text packages
- do not fold command/list/bridge logic into `text-block-*`
- do not move `lsclaw` dispatch tooling into `palette-*` or `list-*`

## Recommended Delivery Order

## Short-Term, Can Start Now

### A. `lsclaw` tooling side

1. Add target manifest schema
2. Add one frozen slice contract format
3. Add one task-run payload generator
4. Add one review-bundle generator

This is enough to let `lsclaw` run:

- Kimi implementation
- Codex review

in a target repo with less prose reconstruction.

### B. `cantool` extraction side

1. Extract `palette-core`
2. Extract `list-interaction-core`

These two have the best reuse-to-risk ratio.

## Medium-Term, After First Adoption

1. `native-command-bridge-core`
2. `react-list-interaction`
3. `react-panel-shell`
4. optional CLI polish for `lsclaw-target-cli`

## Later, Dependency-Heavy

1. full multi-repo `hub-lite` adoption bundles generated from target manifests
2. automatic Kimi fix-loop review bundle generation
3. `tool-card-core`
4. `plugin-command-registry`

## Who Should Own What

### Codex-owned decisions

- package boundaries
- extraction-worthiness
- public API review
- manifest/schema design
- what belongs in `aigluetoolset` vs stays in source repo

### Kimi-suitable work

- narrow package scaffolding
- internal helper implementation
- example app scaffolding
- localized hook extraction
- manifest/template boilerplate filling

That means the `lsclaw` target-repo tool layer itself can also follow the same split:

- Kimi writes the bounded package/CLI scaffolding
- Codex reviews package boundaries and public contracts

## Recommended Next Concrete Step

Do these in order:

1. Add `packages/lsclaw-target-contract`
   - schema
   - slice contract types
   - task payload builder
2. Add `packages/lsclaw-target-cli`
   - `init`
   - `task-run`
   - `review-bundle`
3. Extract `packages/palette-core` from `cantool`
4. Extract `packages/list-interaction-core` from `cantool`

This order keeps:

- orchestration tooling usable quickly
- extraction risk low
- current `text-block-*` track unblocked

## Final Recommendation

Treat the two asks as parallel tracks under one monorepo:

- `lsclaw target-repo tooling`
- `cantool primitive extraction`

Do not try to unify them at the package layer yet.

The right commonality is:

- both are **headless glue**
- both should expose stable contracts
- both should avoid product-specific leakage

But the wrong move would be:

- one generic runtime/framework package
- one generic agent/tool/ui abstraction before the concrete slices are proven

# aigluetoolset

Browser-first, headless text block primitives for product surfaces that repeatedly need:

- stable multiline measurement
- width-aware clamping
- height prediction for dense lists and cards
- thin React integration without locking layout to rendering

The first target is not a full text engine.
The first target is the missing middle layer between CSS-only text presentation and full custom text rendering.

## Initial Scope

- `packages/text-block-core`
  - `measureBlock`
  - `clampBlock`
  - line model
  - cache key normalization
- `packages/text-block-predictor`
  - `predictBlockHeight`
  - invalidation rules
  - confidence scoring
- `packages/react-text-block`
  - `useMeasuredTextBlock`
  - `usePredictedRowHeight`

## Non-Goals

- caret / selection / hit-testing in v0
- full rich-text inline layout in v0
- DOM editor abstractions
- browser-perfect CSS parity
- server-side rendering fidelity

## Real Adoption Targets

- `lsclaw`
  - thread list item summaries
  - workflow stage node sizing
  - later: message timeline virtualization prep
- `vpsagentweb`
  - logs table message preview
  - drawer/card summaries

## Workspace Layout

```text
packages/
  palette-core/
  list-interaction-core/
  react-list-interaction/
  native-command-bridge-core/
  text-block-core/
  text-block-predictor/
  react-text-block/
  lsclaw-target-contract/
  lsclaw-target-cli/
examples/
  command-palette-demo/
  lsclaw-target-demo/
  logs-table-demo/
  workflow-node-demo/
  thread-list-demo/
docs/
  architecture.md
  mvp-contract.md
  adoption-plan.md
  lsclaw-kimi-rollout.md
  lsclaw-plan-installation.md
  cantool-extraction-notes.md
```

## Using lsclaw

This repo is designed so the work can be initiated by `lsclaw`, with:

- Kimi handling implementation passes
- Codex handling review and closeout

See [docs/lsclaw-kimi-rollout.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/lsclaw-kimi-rollout.md).
Install guidance is in [docs/lsclaw-plan-installation.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/lsclaw-plan-installation.md).

## Related Notes

`cantool` extraction analysis is in [docs/cantool-extraction-notes.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/cantool-extraction-notes.md).
Combined `lsclaw × cantool` tooling direction is in [docs/lsclaw-cantool-tooling-plan.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/lsclaw-cantool-tooling-plan.md).
The planned boundary for the next `cantool` extraction package is in [docs/native-command-bridge-boundary.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/native-command-bridge-boundary.md).
The concrete adoption order back into `cantool` is in [docs/cantool-bridge-adoption-sequence.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/cantool-bridge-adoption-sequence.md).
The extraction blockers that still need to be resolved inside `cantool` are in [docs/cantool-pre-extraction-gates.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/cantool-pre-extraction-gates.md).
React test-harness follow-up is tracked in [docs/react-test-stack-plan.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/react-test-stack-plan.md).
Target-repo manifest and slice templates live in:

- [docs/templates/lsclaw-target-manifest.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-target-manifest.json)
- [docs/templates/lsclaw-slice-contract.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-slice-contract.json)

The first repo-side orchestration packages are:

- [packages/lsclaw-target-contract](/Users/echerlos/Downloads/projects/aigluetoolset/packages/lsclaw-target-contract)
- [packages/lsclaw-target-cli](/Users/echerlos/Downloads/projects/aigluetoolset/packages/lsclaw-target-cli)

Repo-local target contract is now checked in under:

- [".aigluetoolset/lsclaw-target.json"](/Users/echerlos/Downloads/projects/aigluetoolset/.aigluetoolset/lsclaw-target.json)
- [".aigluetoolset/slices/native-command-bridge-core-v1.json"](/Users/echerlos/Downloads/projects/aigluetoolset/.aigluetoolset/slices/native-command-bridge-core-v1.json)

The first `cantool` extraction package is:

- [packages/palette-core](/Users/echerlos/Downloads/projects/aigluetoolset/packages/palette-core)
- [packages/list-interaction-core](/Users/echerlos/Downloads/projects/aigluetoolset/packages/list-interaction-core)
- [packages/react-list-interaction](/Users/echerlos/Downloads/projects/aigluetoolset/packages/react-list-interaction)
- [packages/native-command-bridge-core](/Users/echerlos/Downloads/projects/aigluetoolset/packages/native-command-bridge-core)

Minimal usage:

```ts
import { composeCommands, filterCommands, sortCommandsByUsage } from '@aigluetoolset/palette-core';
import { deriveListKeyIntent, moveSelectedIndex } from '@aigluetoolset/list-interaction-core';

const commands = composeCommands([
  { sourceId: 'builtin', items: [{ id: 'open-settings', name: 'Open Settings' }] },
]);

const visible = sortCommandsByUsage(filterCommands(commands, 'settings'));
const intent = deriveListKeyIntent('ArrowDown');
const nextIndex = intent.kind === 'navigate' ? moveSelectedIndex(0, visible.length, intent.action) : 0;
```

Runnable examples:

- [examples/command-palette-demo/demo.mjs](/Users/echerlos/Downloads/projects/aigluetoolset/examples/command-palette-demo/demo.mjs)
- [examples/lsclaw-target-demo/run-demo.mjs](/Users/echerlos/Downloads/projects/aigluetoolset/examples/lsclaw-target-demo/run-demo.mjs)
- [examples/native-command-bridge-demo/demo.mjs](/Users/echerlos/Downloads/projects/aigluetoolset/examples/native-command-bridge-demo/demo.mjs)

Current maturity:

- `lsclaw-target-contract`
  - schema/builder tests cover manifest validation, task payload generation, and review bundle output
- `lsclaw-target-cli`
  - tests cover repo-local init, slice freezing, verify failures, and outside-repo write blocking
- `palette-core`
  - tests cover command composition, fuzzy filtering, ranking, and usage cleanup
- `list-interaction-core`
  - tests cover navigation clamps, keyboard intent derivation, and editable-target guards
- `react-list-interaction`
  - build/typecheck and hook/runtime tests are covered
- `native-command-bridge-core`
  - tests cover invoke success, timeout, retry behavior, subscription lifecycle, and normalized error mapping

`lsclaw-target-cli` safety baseline:

- `init` scaffolds repo-local files under `.aigluetoolset/`
- `freeze-slice` scaffolds a new repo-local slice JSON file and registers it in the manifest
- `task-run` and `review-bundle` print to stdout unless `--output` is provided
- `verify` runs slice verify commands inside the declared target repo and exits non-zero on failed checks
- writes outside the repo root are blocked unless `--allow-outside-repo` is used
- existing outputs require `--force`, and overwrite writes keep a timestamped `.bak-*` recovery copy
- temp write files are cleaned automatically; recovery backups are intentionally retained until the operator deletes them

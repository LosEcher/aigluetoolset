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
  text-block-core/
  text-block-predictor/
  react-text-block/
  lsclaw-target-contract/
  lsclaw-target-cli/
examples/
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
Target-repo manifest and slice templates live in:

- [docs/templates/lsclaw-target-manifest.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-target-manifest.json)
- [docs/templates/lsclaw-slice-contract.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-slice-contract.json)

The first repo-side orchestration packages are:

- [packages/lsclaw-target-contract](/Users/echerlos/Downloads/projects/aigluetoolset/packages/lsclaw-target-contract)
- [packages/lsclaw-target-cli](/Users/echerlos/Downloads/projects/aigluetoolset/packages/lsclaw-target-cli)

`lsclaw-target-cli` safety baseline:

- `init` scaffolds repo-local files under `.aigluetoolset/`
- `task-run` and `review-bundle` print to stdout unless `--output` is provided
- `verify` runs slice verify commands inside the declared target repo and exits non-zero on failed checks
- writes outside the repo root are blocked unless `--allow-outside-repo` is used
- existing outputs require `--force`, and overwrite writes keep a timestamped `.bak-*` recovery copy
- temp write files are cleaned automatically; recovery backups are intentionally retained until the operator deletes them

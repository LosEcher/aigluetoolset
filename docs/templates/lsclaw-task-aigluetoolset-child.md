[parent_epic]
ownerRepo: aigluetoolset
targetProjectPath: /abs/path/to/aigluetoolset
[/parent_epic]

[frozen_contract]
objective: Extract a narrow browser-first text block toolkit with measureBlock, clampBlock, and predictBlockHeight.
constraints:
- Do not implement caret, selection, hit-testing, or editor abstractions.
- Do not widen into SSR fidelity or Node rendering parity.
- Keep rendering adapters thin and keep core logic headless.
- Only edit this repo.
acceptance:
- Root workspace scaffold exists.
- `text-block-core`, `text-block-predictor`, and `react-text-block` package skeletons exist.
- Public docs describe package boundaries and non-goals.
- Public type contracts for v0 are present and coherent.
shared_artifacts:
- docs/mvp-contract.md
- docs/architecture.md
- docs/adoption-plan.md
[/frozen_contract]

[repo_scope]
goal: Create or refine the initial aigluetoolset workspace and implement only the frozen v0 skeleton.
allowed_scope:
- AGENTS.md
- README.md
- package.json
- pnpm-workspace.yaml
- tsconfig.base.json
- docs/**
- packages/**
- examples/**
expected_artifacts:
- package scaffold
- public type contracts
- short implementation note in docs if assumptions are introduced
verification:
- ensure package structure matches docs
- ensure exported public API names match the MVP contract
[/repo_scope]

[rules]
- Stay inside this repo.
- If a better abstraction would require widening into editor or interaction scope, stop and report it instead of implementing it.
- If review-quality acceptance is needed, stop after implementation handoff for Codex review.
[/rules]

# aigluetoolset AGENTS

## Scope

This repo is a browser-first, headless text layout utility workspace.
It exists to extract small, reusable text block primitives from real product needs in `lsclaw`, `vpsagentweb`, and adjacent repos.

## Read Order

1. `README.md`
2. `docs/mvp-contract.md`
3. `docs/architecture.md`
4. `docs/lsclaw-kimi-rollout.md`

## Product Rules

- Keep the first release narrow: `measureBlock`, `clampBlock`, and `predictBlockHeight`.
- Do not start with caret, selection, hit-testing, or a full editor core.
- Do not start with SSR fidelity or Node rendering parity.
- Prefer browser-first and offscreen-canvas-first assumptions.
- Keep rendering adapters thin; core packages must stay headless.

## Package Rules

- `packages/text-block-core` owns input/output contracts and measurement-oriented primitives.
- `packages/text-block-predictor` owns prediction, cache invalidation, and confidence.
- `packages/react-text-block` owns React hooks only; do not move core logic into hooks.
- Examples should stay small and target concrete adoption surfaces from real repos.

## Collaboration Rules

- When using `lsclaw` for execution, freeze the contract in this repo first.
- Prefer Kimi for implementation passes and Codex for review/closeout.
- Do not let implementation agents widen scope beyond the frozen contract.
- Review findings should feed back into the same narrow slice before expanding the roadmap.

## Validation

- Keep contracts and docs in sync when package boundaries or public APIs change.
- Before extracting into another repo, document the target adoption surface in `docs/adoption-plan.md`.

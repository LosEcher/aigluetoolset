# lsclaw -> Kimi Rollout

## Goal

Use `lsclaw` to initiate implementation work for `aigluetoolset` while keeping:

- Kimi as the implementation agent
- Codex as the reviewer and closeout owner

## Why This Split

`lsclaw` already has:

- unified `/api/tasks/run`
- parent/child orchestration patterns
- Kimi agent availability
- explicit plan selection support

Relevant existing support:

- [default-agent.json](/Users/echerlos/Downloads/projects/lsclaw/control-plane/config/default-agent.json#L20)
- [agent-team-kimi-multi-role.json](/Users/echerlos/Downloads/projects/lsclaw/control-plane/config/agent-team-kimi-multi-role.json#L5)
- [task-run-contract.md](/Users/echerlos/Downloads/projects/lsclaw/docs/api/task-run-contract.md)
- [agent-team-module-consistency.json](/Users/echerlos/Downloads/projects/lsclaw/control-plane/config/agent-team-module-consistency.json)

## Important Constraint

Do not use `kimi-multi-role` as-is for production closeout if the desired workflow is:

- Kimi implements
- Codex reviews

That plan assigns `review` to Kimi too.

## Recommended Execution Modes

### Recommended runtime choice

For the implementation lane, prefer the same shape already used in `lsclaw` module-consistency plans:

- `agent: "opencode"`
- `cli.opencodeModel: "kimi-for-coding/k2p5"`

Reason:

- this route already exists in current `lsclaw` plans
- it is a better fit for "Kimi does the writing work" than inventing a brand-new runtime path
- Codex can stay the reviewer without changing the high-level workflow

If you specifically need `kimi-cli`, keep it as a fallback, not the first production template.

### Mode A: single-repo first

Use `/api/tasks/run` directly against `aigluetoolset`.

Recommended for:

- initial repo scaffolding
- package skeleton
- API contract implementation
- example app scaffolding

Suggested request shape:

```json
{
  "mode": "team",
  "dispatchMode": "queue",
  "agentName": "opencode",
  "planPath": "/abs/path/to/lsclaw/control-plane/config/agent-team-kimi-implement-codex-review.json",
  "ownerRepo": "aigluetoolset",
  "targetProjectPath": "/abs/path/to/aigluetoolset",
  "task": "Implement the frozen MVP contract in aigluetoolset without widening into caret/selection/editor scope."
}
```

Operational rule:

- stop Kimi output at implementation/research-report handoff
- do not treat Kimi self-review as final acceptance
- route the result to Codex review manually

### Mode B: parent/child after the core stabilizes

Use `hub-lite` only after the package contract is stable enough to drive multiple repos.

Recommended child split:

1. `aigluetoolset`
   - implement or refine the shared package
2. `lsclaw`
   - adopt workflow/thread surfaces
3. `vpsagentweb`
   - adopt logs preview surface

## Best Long-Term Plan

Add a dedicated `lsclaw` plan with this shape:

1. `research` -> Kimi
2. `solution-design` -> Kimi
3. `research-report` -> Kimi
4. `implementation` -> Kimi
5. `review` -> Codex
6. `fix-kimi` -> Kimi
7. `final-plan` -> Codex

That is better than:

- all-Kimi flow
- fully manual stage interruption every round

Draft file in this repo:

- [lsclaw-agent-team-kimi-implement-codex-review.draft.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-agent-team-kimi-implement-codex-review.draft.json)

## Kimi-Suitable Work

- repo scaffolding
- package skeleton creation
- narrow API implementation
- demo setup
- unit tests inside the frozen slice

## Codex-Owned Work

- package boundary decisions
- public API review
- cross-repo widening decisions
- final findings and acceptance state
- determining whether an abstraction is extraction-worthy

## First Round Prompt Shape

Use the child task template in:

- [lsclaw-task-aigluetoolset-child.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-task-aigluetoolset-child.md)
- [lsclaw-task-run-aigluetoolset-kimi-codex-review.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-task-run-aigluetoolset-kimi-codex-review.json)

Freeze these rules before dispatch:

- only this repo
- only the v0 package split
- no caret/selection/editor scope
- browser-first only
- no SSR guarantees

## Repo-Local Contract Baseline

The target repo now carries a checked-in `lsclaw` contract:

- [".aigluetoolset/lsclaw-target.json"](/Users/echerlos/Downloads/projects/aigluetoolset/.aigluetoolset/lsclaw-target.json)
- [".aigluetoolset/slices/native-command-bridge-core-v1.json"](/Users/echerlos/Downloads/projects/aigluetoolset/.aigluetoolset/slices/native-command-bridge-core-v1.json)

Operational rule:

- keep `planPath` injected from the `lsclaw` caller side
- keep `targetProjectPath`, `verifyCommands`, and frozen slice scope owned by the target repo
- start with single-repo `/api/tasks/run` before any `hub-lite` parent/child rollout

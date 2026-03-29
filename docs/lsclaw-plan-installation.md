# lsclaw Plan Installation

## Goal

Install a dedicated `lsclaw` team plan so the default execution shape becomes:

1. narrow scope freeze
2. Kimi implementation
3. Codex review
4. Kimi fix loop
5. Codex closeout

This avoids using `kimi-multi-role` as-is, which would keep review inside the Kimi lane.

## Source Files In This Repo

Use these files as the source of truth:

- [lsclaw-agent-team-kimi-implement-codex-review.draft.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-agent-team-kimi-implement-codex-review.draft.json)
- [lsclaw-task-run-aigluetoolset-kimi-codex-review.json](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-task-run-aigluetoolset-kimi-codex-review.json)
- [lsclaw-task-aigluetoolset-child.md](/Users/echerlos/Downloads/projects/aigluetoolset/docs/templates/lsclaw-task-aigluetoolset-child.md)

## Recommended Install Target

Copy the draft plan into:

```text
<lsclaw>/control-plane/config/agent-team-kimi-implement-codex-review.json
```

## Recommended Metadata Update

Add one entry to:

```text
<lsclaw>/control-plane/config/default-agent.json
```

Inside `teamConfig.availablePlans`:

```json
{
  "id": "kimi-implement-codex-review",
  "path": "./config/agent-team-kimi-implement-codex-review.json",
  "label": "Kimi 实现 + Codex 审查",
  "description": "Claude 冻结窄范围，Kimi 负责实现与修复，Codex 负责 review 和最终收口。"
}
```

## Why Keep Claude In The Front

The first three stages are intentionally:

- `research` -> Claude
- `solution-design` -> Claude
- `research-report` -> Claude

Reason:

- scope freeze and handoff quality matter more than writer throughput
- Kimi is better used on the narrow implementation lane
- Codex should review code, not reconstruct missing scope boundaries

## Runtime Choice

The plan uses:

- `agent: "opencode"`
- `cli.opencodeModel: "kimi-for-coding/k2p5"`

This follows an already existing `lsclaw` precedent and is safer than introducing a brand-new runtime path.

## Install Steps

1. Copy the draft plan into `lsclaw/control-plane/config/`.
2. Register the new plan in `default-agent.json`.
3. Restart or reload the local `lsclaw` control plane if required by the current runtime.
4. Use the request template from this repo and replace:
   - `<lsclaw-path>`
   - `<aigluetoolset-path>`
5. Dispatch a single-repo run first.

## First Run Recommendation

Do not start with `hub-lite`.

Start with one direct `/api/tasks/run` request against `aigluetoolset`:

- one repo
- one frozen contract
- one narrow slice

Only move to parent/child `hub-lite` after:

- package boundaries stop changing every round
- review findings are mostly local
- adoption work in `lsclaw` and `vpsagentweb` becomes the next bottleneck

## Suggested First Slice

The first useful slice is:

- workspace scaffold
- `text-block-core` public types
- `measureBlock`
- `clampBlock`
- `predictBlockHeight`
- docs that freeze v0 non-goals

Avoid starting with:

- canvas renderer adapters
- interaction primitives
- SSR/offline fidelity
- cross-repo adoption in the same round

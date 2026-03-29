# Adoption Plan

## Phase 1

Build and validate the core in this repo only.

Targets:

- `examples/logs-table-demo`
- `examples/workflow-node-demo`
- `examples/thread-list-demo`

## Phase 2

Adopt into `vpsagentweb`.

First file:

- [Logs/index.tsx](/Users/echerlos/Downloads/projects/vpsagentweb/apps/web/src/pages/Logs/index.tsx)

Goal:

- replace fixed `msg.slice(0, 120)` preview with width-aware line clamping
- make message preview behavior stable across viewport widths

## Phase 3

Adopt into `lsclaw`.

First files:

- [StageNode.tsx](/Users/echerlos/Downloads/projects/lsclaw/control-plane/src/admin/app/components/workflow/StageNode.tsx)
- [layout.ts](/Users/echerlos/Downloads/projects/lsclaw/control-plane/src/admin/app/components/workflow/utils/layout.ts)
- [ThreadListItem.tsx](/Users/echerlos/Downloads/projects/lsclaw/control-plane/src/admin/app/components/chat/thread-list/ThreadListItem.tsx)

Goal:

- move from fixed node dimensions and CSS-only clamping toward text-aware sizing
- prepare data needed for later timeline/list virtualization

## Deferred Adoption

These should not block v0 extraction:

- `lsclaw` message timeline virtualization
- canvas/SVG adapters
- custom editor-like text interaction

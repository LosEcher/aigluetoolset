# CanTool Extraction Notes

## Purpose

This note evaluates `cantool` as an upstream product to extract reusable libraries from, and clarifies where it fits relative to the current `aigluetoolset` direction.

The short version:

- `cantool` is a strong source project for DOM-first, headless interaction primitives.
- It is not a good primary source project for a general-purpose Canvas UI runtime.
- The useful abstractions are in command orchestration, list interaction, panel shell behavior, config-driven tools, and native command bridges.

## What CanTool Actually Is

`cantool` is a Tauri + React desktop tool app with a launcher shell, panel system, keyboard-driven navigation, and plugin-backed commands.

The main structure is visible in:

- `frontend/src/App.tsx`, where the app keeps a panel registry, switches between launcher and panel views, scrolls the selected item into view, and dispatches commands centrally.
- `frontend/src/hooks/useCommands.ts`, where the command catalog is assembled from built-in features, workflows, and external plugin commands.
- `frontend/src/hooks/useKeyboard.ts`, `usePanelKeyboard.ts`, and `useManagementListKeyboard.ts`, where global keyboard handling, focus trap, IME-safe Enter behavior, and selected-item scrolling are implemented.

That means the core reusable value is closer to "launcher/palette runtime" than to "rendering runtime".

## Why It Should Not Be The Main Canvas Path

For the Canvas question, `cantool` is evidence against making Canvas the default path for general product UI.

The current frontend depends on:

- native text inputs and textareas
- DOM focus and focus trap
- keyboard event routing around editable targets
- standard listbox semantics
- direct panel composition with React components

That is visible in:

- `frontend/src/hooks/useKeyboard.ts`, which explicitly checks for `input`, `textarea`, `select`, and `contentEditable`.
- `frontend/src/hooks/usePanelKeyboard.ts`, which depends on DOM focus containment and input-state guards.
- `frontend/src/panels/ClipboardPanel.tsx`, which relies on a real search input, native selection, and panel-local keyboard navigation.

So for `cantool`, a full "HTML to Canvas" path would replace working DOM semantics with a harder custom runtime for little gain.

If Canvas enters this product at all, it should be limited to isolated high-density regions, not the app shell.

## Best Extraction Targets

### 1. `palette-core`

This is the highest-value extraction target.

What exists in `cantool`:

- a normalized `CommandItem` model
- usage-based ranking and persistence
- command source composition from features, workflows, and plugins
- query filtering and selected-index control

Key source files:

- `frontend/src/stores/commandStore.ts`
- `frontend/src/hooks/useCommands.ts`

What to extract:

- `CommandItem` / `CommandSource` schema
- usage statistics model
- ranking interface
- query filtering interface
- command composition pipeline
- optional persistence adapter

What not to extract yet:

- product-specific command ids like `clipboard`, `ocr`, `team`
- feature flags tied to `cantool` config shape

Suggested package:

- `packages/palette-core`

Suggested API sketch:

```ts
type CommandItem = {
  id: string
  name: string
  description?: string
  tags?: string[]
  shortcut?: string
  pinned?: boolean
  source?: "builtin" | "workflow" | "plugin"
}

type UsageStats = Record<string, { count: number; lastUsed: number }>

declare function filterCommands(items: CommandItem[], query: string): CommandItem[]
declare function rankCommands(items: CommandItem[], usage: UsageStats, query: string): CommandItem[]
declare function composeCommands(sources: CommandSource[]): CommandItem[]
```

### 2. `list-interaction`

This is the second best extraction target because it is already headless in spirit.

What exists in `cantool`:

- keyboard-driven selected-index movement
- activation and close semantics
- IME-safe Enter behavior
- scroll-to-selected
- focus-follow-selected

Key source files:

- `frontend/src/hooks/usePanelKeyboard.ts`
- `frontend/src/hooks/useManagementListKeyboard.ts`
- `frontend/src/hooks/useKeyboard.ts`

What to extract:

- selected-index controller
- navigation reducer
- DOM adapter for `scrollIntoView`
- IME-safe activation guard
- focus trap helper

This can be split into:

- `packages/list-interaction-core`
- `packages/react-list-interaction`

This package is useful well beyond `cantool`: launcher UIs, settings lists, command palettes, picker dialogs, and management consoles all reuse it.

### 3. `panel-shell`

`cantool` has a repeated panel-frame pattern:

- header with close action
- focus trap
- keyboard close behavior
- search area
- content region
- optional tabs

Key source files:

- `frontend/src/App.tsx`
- `frontend/src/panels/ClipboardPanel.tsx`
- `frontend/src/panels/DevToolsPanel.tsx`

What to extract:

- shell layout contract
- close/focus behavior
- optional search/header slots
- panel mode state contract

What not to extract:

- full visual styling
- all panel-specific state

Suggested package:

- `packages/react-panel-shell`

This should remain a thin headless or lightly styled package. If it becomes a full design system, it will stop being broadly reusable.

### 4. `tool-card-runtime`

`DevToolsPanel` plus `TransformTool` show a good config-driven pattern:

- tool metadata in config
- shared input/process/output workflow
- optional sync transform
- optional async transform
- optional Tauri command backend

Key source files:

- `frontend/src/panels/DevToolsPanel.tsx`
- `frontend/src/panels/devtools/TransformTool.tsx`

What to extract:

- `ToolConfig`
- common tool execution lifecycle
- input/output state model
- action/result normalization
- host callbacks for success/error/toast

Suggested package:

- `packages/tool-card-core`
- optionally `packages/react-tool-card`

This is especially useful for "small utilities panel" products, internal ops apps, or desktop helper tools.

### 5. `native-command-bridge`

`cantool` has two overlapping abstractions around Tauri invoke:

- a generic `lib/tauri.ts` wrapper with timeout, retries, normalization, and event listening
- a React hook `useTauri.ts` that integrates invocation recording and safe result envelopes

Key source files:

- `frontend/src/lib/tauri.ts`
- `frontend/src/hooks/useTauri.ts`

What to extract:

- typed command bridge interface
- timeout / retry policy
- normalized error shape
- event subscription wrapper
- framework adapter for React

Suggested package:

- `packages/native-command-bridge-core`
- `packages/react-native-command-bridge`

The extracted version must not be Tauri-only in its public contract. Better shape:

- core: generic request/response bridge
- adapter: Tauri implementation

That keeps it usable for Electron, web worker RPC, local HTTP control planes, and browser extension message bridges.

### 6. `plugin-command-registry`

`cantool` already treats external plugin commands as first-class launcher actions.

Relevant evidence:

- external plugin commands are stored in the command store
- the launcher dispatches plugin commands centrally
- settings expose install/enable/disable/uninstall flows

Key source files:

- `frontend/src/stores/commandStore.ts`
- `frontend/src/App.tsx`
- `frontend/src/panels/settings/PluginsTab.tsx`
- generated API bindings in `frontend/src/types/generated/api.ts`

What to extract:

- external command descriptor schema
- registry lifecycle
- enable/disable state model
- host-side error normalization

Suggested package:

- `packages/plugin-command-registry`

This is useful if you want `aigluetoolset` to support "host app injects commands/tools" without copying app-specific store logic.

## What Should Stay Inside CanTool

Do not extract these in the first pass:

- app-specific feature flags tied to CanTool config
- clipboard domain logic
- AI/OCR/ASR business flows
- panel names and navigation vocabulary
- toast copy and end-user strings
- app health and diagnostics surfaces

These are product responsibilities, not base library responsibilities.

## Where This Connects To AIGLUETOOLSET

There are two distinct tracks now.

### Track A: text/layout primitives

This is the repo's current primary direction:

- `text-block-core`
- `text-block-predictor`
- `react-text-block`

These solve dense text display, measurement, clamping, and future virtualization support.

### Track B: launcher/panel interaction primitives

This is what `cantool` contributes:

- command palette core
- keyboard/list interaction
- panel shell
- tool-card runtime
- plugin command bridge

These two tracks can live in the same monorepo, but they should remain separate package families.

Do not force everything under a single "Canvas UI runtime" story. That would blur two different product directions and make the repo harder to evolve.

## Where Canvas Still Makes Sense For CanTool

Canvas can still be a useful future direction, but only for isolated subsystems.

Good candidates:

- image annotation or OCR review regions
- screenshot markup tools
- very large visual diff or preview surfaces
- graph or node-based workflow editors
- very large command/result lists where DOM layout becomes the bottleneck

Bad candidates:

- global app shell
- settings forms
- plugin management
- search inputs
- general text-heavy panels

So the right Canvas framing for a `cantool`-like app is:

"high-performance interactive region runtime"

not:

"replace the app UI with Canvas"

## Recommended Package Roadmap

Start with the smallest and most reusable extractions.

Phase 1:

1. `palette-core`
2. `list-interaction-core`
3. `react-list-interaction`

Phase 2:

1. `react-panel-shell`
2. `native-command-bridge-core`
3. `react-native-command-bridge`

Phase 3:

1. `tool-card-core`
2. `react-tool-card`
3. `plugin-command-registry`

Phase 4:

1. integrate `text-block-core` into dense lists and previews
2. evaluate whether any isolated panel needs a Canvas-backed rendering area

## Kimi Task Slicing

If this is implemented through `lsclaw` with Kimi as the implementation agent, the slicing should be narrow.

Good tasks:

1. extract `CommandItem` schema and ranking utilities into `palette-core`
2. extract keyboard/list reducer logic into `list-interaction-core`
3. build React wrappers for selected-index navigation and scroll-to-selected
4. extract generic command bridge interfaces from Tauri-specific code
5. write adapter tests and small demos

Bad tasks:

1. "extract all reusable frontend code from cantool"
2. "turn cantool into a Canvas UI runtime"
3. "make one package that powers command palette, tools panel, plugin system, and text layout"

Those are scope traps.

## Practical Conclusion

For `cantool`, the strongest reusable layer is:

- headless interaction primitives for command-driven desktop/web tools

not:

- a universal cross-platform Canvas rendering foundation

If you combine `cantool` with the earlier `Pretext`-inspired direction, the clean structure is:

- text/layout packages for dense text rendering and prediction
- interaction/palette packages for launcher-style command and panel systems
- optional future Canvas packages only for isolated high-performance surfaces

That is a credible foundation. Trying to unify all of it immediately as one Canvas-first runtime is not.

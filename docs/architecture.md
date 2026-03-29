# Architecture

## Positioning

`aigluetoolset` sits between:

- CSS-only text presentation
- full text rendering / editing engines

The first release is deliberately scoped to a narrower layer:

- headless text block measurement
- stable clamping
- height prediction

That layer is reusable by:

- DOM UIs that need better list sizing
- workflow/node cards that need text-aware dimensions
- later canvas/SVG renderers that want the same line model

## Package Split

### `text-block-core`

Owns:

- public input/output contracts
- block measurement entrypoints
- line segmentation data model
- truncation and visible-range calculation
- cache key normalization

Does not own:

- React lifecycle
- app-specific caching policy
- server/runtime-specific font loading

### `text-block-predictor`

Owns:

- heuristic height prediction
- width/font/text-based invalidation
- confidence scoring
- cache policy helpers

Does not own:

- actual rendering
- app-level persistence

### `react-text-block`

Owns:

- thin hooks around core and predictor
- browser lifecycle wiring
- optional debug overlays

Does not own:

- measurement logic
- prediction formulas

## Data Flow

1. UI provides `TextBlockInput`.
2. `text-block-core` returns a stable `MeasuredTextBlock`.
3. `text-block-predictor` may provide an estimate before full measurement settles.
4. Adapters consume the result for:
   - row height
   - card height
   - line clamp preview
   - responsive node dimensions

## First Adoption Surfaces

### `lsclaw`

- workflow stage node output preview
- thread list item title/status density
- later message timeline virtualization support

### `vpsagentweb`

- logs table message column preview
- summary cards and drawers

## Deferred Layers

These are explicitly deferred until after the first productized extraction:

- caret / selection / hit-testing
- rich inline object layout
- bidi-aware cursor movement
- SSR/offline deterministic fidelity
- canvas-native renderer adapters

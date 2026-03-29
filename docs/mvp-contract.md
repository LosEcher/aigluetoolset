# MVP Contract

## Objective

Extract a small, reusable text block toolkit from real product surfaces in `lsclaw` and `vpsagentweb`.

The toolkit must solve:

- width-aware multiline measurement
- deterministic line clamping
- height prediction for dense list/card surfaces

## Must Ship

### `measureBlock(input)`

Input:

- text
- width
- font family / size / weight
- line height
- white-space / overflow-wrap / word-break
- locale

Output:

- `lines[]`
- `lineCount`
- `height`
- `visibleText`
- `truncated`
- `overflowRange`
- `cacheKey`

### `clampBlock(input)`

Must support:

- `lineClamp`
- truncation state
- visible substring derivation
- same output model as `measureBlock`

### `predictBlockHeight(input)`

Must support:

- heuristic estimate before full measure
- width-sensitive invalidation
- confidence score
- cache key

## First Public Types

```ts
type TextBlockInput = {
  text: string
  width: number
  font: string
  fontSize: number
  fontWeight?: string | number
  lineHeight?: number
  letterSpacing?: number
  whiteSpace?: 'normal' | 'pre-wrap'
  overflowWrap?: 'normal' | 'break-word' | 'anywhere'
  wordBreak?: 'normal' | 'break-all'
  lineClamp?: number | null
  locale?: string
}
```

```ts
type TextLine = {
  start: number
  end: number
  text: string
  width: number
  top: number
  height: number
}
```

```ts
type MeasuredTextBlock = {
  lines: TextLine[]
  width: number
  height: number
  lineCount: number
  visibleText: string
  truncated: boolean
  overflowRange: [number, number] | null
  cacheKey: string
}
```

## Explicit Non-Goals

- caret / selection / hit-testing
- rich text runs with inline images/chips
- bidi navigation semantics
- browser-perfect CSS emulation
- server-side fidelity guarantees
- terminal text rendering

## Acceptance Criteria

1. The package boundaries remain narrow and headless.
2. The first demos cover:
   - logs table preview
   - workflow node preview
   - thread list preview
3. At least one adoption plan is documented for `lsclaw` and one for `vpsagentweb`.
4. The public API is small enough to review in one document without hidden coupling to React.

## Boundary Rules

- Browser-first is allowed.
- Offscreen canvas is allowed.
- Heuristics are allowed if confidence and fallback are explicit.
- The API should be stable before widening into interaction primitives.

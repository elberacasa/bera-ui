# Rolling counter

Give changing quantities a sense of direction.

## Choose this for

Adjustable integer quantities, totals, or compact counters.

## Integration

Connect value/onValueChange and the allowed range. The reference supports 0–999; adapt digit count explicitly for larger ranges or signed values.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `RollingCounter`

Props: value, defaultValue, onValueChange, min, max, label, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/rolling-counter.tsx`
Styles: `../recipes/rolling-counter.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

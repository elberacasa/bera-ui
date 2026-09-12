# Text swap

A new thought, without a hard cut.

## Choose this for

Short status messages that change as an operation progresses.

## Integration

Connect the status index with value; supply statuses with text and icons. Keep a single polite announcement for a meaningful change.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `TextSwap`

Props: statuses, value, speed, radius, className, style.

Defaults: `speed={1}`, `preview={false}`. Speed scales timing. Radius does not apply to TextSwap; its radius prop remains accepted for API compatibility. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/text-swap.tsx`
Styles: `../recipes/text-swap.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

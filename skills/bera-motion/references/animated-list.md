# Animated list

Add, remove, and rearrange without losing your place.

## Choose this for

Changing file lists, search results, queues, or selected items.

## Integration

Supply items with unique stable IDs and React content. The host owns insertion, removal, sorting, and focus after its own commands. Keep business actions in the host; this recipe supplies list semantics and motion. Exiting rows leave the focus order immediately. Replay never changes host data or repeats actions.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `AnimatedList`

Props: items, emptyState, ariaLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/animated-list.tsx`
Styles: `../recipes/animated-list.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

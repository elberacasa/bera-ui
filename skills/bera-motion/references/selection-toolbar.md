# Selection toolbar

Actions take shape around your selection.

## Choose this for

Bulk actions for selected files, messages, or table rows.

## Integration

Connect count, actions, and onClear to host-owned selection. Each action calls its real onSelect operation; pending and failure follow its promise. The host clears or updates selection after acceptance. Supply returnFocusRef for focused controls that disappear; unrelated focus stays put. Preview archive and restore affect local sample files only. Replay never calls actions.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `SelectionToolbar`

Props: count, actions, onClear, returnFocusRef, ariaLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/selection-toolbar.tsx`
Styles: `../recipes/selection-toolbar.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

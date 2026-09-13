# Inline edit

Rename in place. Keep the context.

## Choose this for

Project names, short titles, and metadata that can be edited in place.

## Integration

Connect value and onCommit to the actual update. Resolve only after saving succeeds, reject on failure, and update the controlled value after acceptance. Optional validate returns a readable error. Enter saves; Escape or Cancel discards an idle draft. During a pending save, Escape or Close only hides the editor: the operation continues and new commits remain blocked until settlement. Composition input never submits early. The preview changes local data only. Replay must not save or move focus.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `InlineEdit`

Props: value, defaultValue, onCommit, validate, label, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/inline-edit.tsx`
Styles: `../recipes/inline-edit.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

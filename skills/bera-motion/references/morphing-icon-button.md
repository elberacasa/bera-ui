# Icon morph

Connect open and close with the same SVG strokes.

## Choose this for

A menu or panel toggle that needs a clear change of state.

## Integration

Connect pressed/onPressedChange to the actual panel state. Keep the stable label and existing focus management. Forward aria-controls to the panel and preserve host dismissal behavior. Replay changes only the icon, never the application state.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `MorphingIconButton`

Props: pressed, defaultPressed, onPressedChange, label, labels, disabled, buttonRef, native button attributes, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/morphing-icon-button.tsx`
Styles: `../recipes/morphing-icon-button.css`
Dependencies: React, motion. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

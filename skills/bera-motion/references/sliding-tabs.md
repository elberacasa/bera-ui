# Sliding tabs

Switch views with a selection that follows your lead.

## Choose this for

A small set of modes, filters, or views with an existing selected value.

## Integration

Connect value/onValueChange and supply items. Keep each tab associated with its existing panel.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `SlidingTabs`

Props: items, value, defaultValue, onValueChange, ariaLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/sliding-tabs.tsx`
Styles: `../recipes/sliding-tabs.css`
Dependencies: React, motion. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

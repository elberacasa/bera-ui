# Play / pause

One shape, two states. Continuous in both directions.

## Choose this for

Play and pause controls for video, audio, or user-controlled animation.

## Integration

Connect playing to the actual media or animation state, and onPlayingChange to a playback request. Update state from real play, pause, and ended events; handle rejected play promises in the host. The button does not operate media itself. Supply accessible Play/Pause labels and keep native keyboard behavior. The optional local preview is a finite animation, not an audio or video player. Replay changes only the icon, never playback state or callbacks.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `PlaybackToggle`

Props: playing, defaultPlaying, onPlayingChange, labels, disabled, buttonRef, native button attributes, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/playback-toggle.tsx`
Styles: `../recipes/playback-toggle.css`
Dependencies: React, motion. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

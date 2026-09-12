# Refine the transition

Choose a clear action and inspect the whole sequence: input, visible acknowledgement, state change, and rest. Tie motion to that action; avoid ambient loops or additional spectacle.

- **Onset:** Acknowledge input promptly. Keep async progress visible while the real operation runs.
- **Sequencing:** Order the parts so cause and outcome remain clear. Introduce delays only when they improve comprehension.
- **Continuity:** Preserve spatial anchors and identity between states. Animate surfaces without stretching text or destabilizing layout.
- **Reversal:** Interrupt midway and reverse repeatedly. Continue from the current visual state; avoid stale exits, duplicated items, queued replay, or a late callback restoring an obsolete state.
- **Settlement:** End in a readable, usable state without unwanted oscillation, clipping, or lingering pointer interception.

Use the recipe's `speed` parameter to tune timing as a system, then adjust individual phases only when the interaction calls for it. Keep the host's shape through `radius`. Judge normal playback first; slow playback helps inspect the handoff between phases. Production uses `preview={false}` and natural sizing.

## Verify the behavior

Exercise keyboard activation, focus visibility and return, menu dismissal, controlled input updates, and content bounds where applicable. Check both desktop and narrow phone widths. Trigger repeated input during entry, exit, and pending states.

With reduced motion enabled, state changes and feedback must remain clear while unnecessary displacement, scaling, and rolling are removed or shortened. Focus and semantics must remain correct regardless of animation duration.

Verify successful and failed real operations. A success state follows actual success; pending state follows the real operation's lifetime. Demonstration replay resets only presentation state, never repeats an application action, and never steals focus. Adapt ToastStack motion through the host's existing notification provider.

Describe the observed improvement and any unverified behavior. Distinguish a visual inspection from an exercised application action.

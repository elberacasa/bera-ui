# Quality standards

Review the behavior people use, the motion they see, and the source they take into their project. Record results and any limits in the pull request that changes the implementation.

## Interaction

- Exercise the normal action and its success, failure, and cancellation paths where applicable. Success feedback follows the real operation.
- Repeat input during entry, exit, and pending states. The final state must reflect the latest valid input, without stale callbacks or queued animations.
- Check controlled values and application callbacks. Replay must not repeat a save, clipboard write, submission, or other application side effect.
- Verify text, icons, and surfaces through the whole transition. Watch for stretching, clipping, unintended layout shifts, and invisible elements that still intercept input.
- For SVG morphs, inspect endpoint meaning, intermediate geometry, stroke weight, bounds, and reversal.

## Keyboard and reduced motion

Navigate with the keyboard. Check activation, focus visibility, focus entry and return, and Escape or outside dismissal where relevant. Closed interactive content must leave the focus order. Preserve the host primitive's roles and element relationships.

Enable the operating system or browser's reduced-motion preference. State, feedback, and focus must remain correct when unnecessary movement is removed. Slow playback is a separate inspection tool and does not replace this check.

## Layout and themes

Inspect desktop and narrow phone widths, including 320px. Check touch targets, overflow, long content, and the source inspector. A copied component must fit its host without requiring gallery styles.

Test representative host tokens when styling changes. Foreground, surfaces, borders, hover, and focus states must work together. Do not assume that inheriting text color alone makes a transition theme-compatible.

## Source and kit

Verify that generated TSX and CSS match the live implementation. Each extracted TSX module must compile in a consumer project and export only its selected component. Keep dependencies and integration notes accurate.

For distribution changes, exercise installation into a temporary project: inspect `--dry-run`, install one selected pair, repeat the operation, and preserve differing destination files. Check skill contents, archive extraction, and deterministic generation. Use real application callbacks in integration examples and clearly identify reference-only behavior.

## Repository checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:kit
npm run build
```

Run checks relevant to the change before requesting review. Add regression coverage for meaningful behavior and failure paths; avoid tests that merely restate implementation details. A successful build does not substitute for inspecting the changed interaction.

In the pull request, state which browsers, viewport sizes, input methods, and preferences were actually exercised. Distinguish a source review from a browser check and a viewport check from a physical-device test.

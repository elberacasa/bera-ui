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

For a host adapter, also change reduced motion during an active exit. Confirm the primitive finishes unmounting, restores page interaction and accessibility, and returns focus correctly. Test reopening during exit without replacing the content node or jumping back to an animation endpoint.

## Layout and themes

Inspect desktop and narrow phone widths, including 320px. Check touch targets, overflow, long content, and the source inspector. A copied component must fit its host without requiring gallery styles.

Test representative host tokens when styling changes. Foreground, surfaces, borders, hover, and focus states must work together. Do not assume that inheriting text color alone makes a transition theme-compatible.

## Source and kit

Verify that generated TSX and CSS match the live implementation. Each extracted TSX module must compile in a consumer project and export only its selected component. Keep dependencies and integration notes accurate.

CSS adapters distribute only their declared stylesheet. Verify that installing one leaves the host primitive, theme, dependencies, and configuration unchanged; keep its discovery metadata distinct from standalone components.

For distribution changes, exercise installation into a temporary project: inspect `--dry-run`, install one selected pair, repeat the operation, and preserve differing destination files. Check skill contents, archive extraction, and deterministic generation. Use real application callbacks in integration examples and clearly identify reference-only behavior.

Validate registry items against the shadcn schema and compare their embedded files with the same generated source and CSS used by the kit. Exercise the real shadcn CLI against a temporary consumer, including direct URL and configured namespace installation. Check alias-based destinations, sibling CSS imports, dependency changes, and compilation. Confirm that payloads do not replace host primitives or inject global theme changes. Record the actual CLI and host versions tested; an install in one setup does not establish compatibility with every React or shadcn project.

Keep the machine-readable catalog, registry index, skill links, and `llms.txt` aligned with the authored catalog. Website links must resolve on the public origin; kit links must resolve after extraction. Check that an agent can discover one relevant recipe and its integration requirements without loading the whole collection.

## Repository checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:kit
npm run build
```

For registry changes, run the released CLI smoke test as well:

```sh
npm exec --yes --package=shadcn@4.21.0 -- node scripts/test-shadcn-registry.mjs
```

It downloads dependencies into temporary consumer projects and checks actual installs, alias resolution, edited-file preservation, and compilation. The CLI version must match the registry's recorded tested version. The offline `test:kit` suite also compiles every usage example shown in the Install tab.

For Radix menu adapter changes, run the browser regression check:

```sh
npm exec --yes --package=playwright@1.62.1 -- playwright install chromium
npm exec --yes --package=playwright@1.62.1 -- node scripts/test-radix-menu.mjs
```

If Chrome is already installed, pass `--channel chrome` to the second command instead of installing Chromium. The check uses the installed Radix primitive with the actual adapter stylesheet in a temporary fixture. It verifies exit cleanup, page interaction, uninterrupted reversal, and reduced motion changed during exit. CI runs the same check in Chromium. Safari and Firefox require separate verification.

Run checks relevant to the change before requesting review. Add regression coverage for meaningful behavior and failure paths; avoid tests that merely restate implementation details. A successful build does not substitute for inspecting the changed interaction.

In the pull request, state which browsers, viewport sizes, input methods, and preferences were actually exercised. Distinguish a source review from a browser check and a viewport check from a physical-device test.

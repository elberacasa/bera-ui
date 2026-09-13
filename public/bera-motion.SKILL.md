---
name: bera-motion
description: Discover, review, apply, or refine reusable React interface transitions from the Bera motion kit. Use for motion in existing controls and surfaces while preserving the host application's behavior and styling.
---

# Bera motion

Start with the user's action and the states it connects. Improve that transition within the existing interface. This kit supplies standalone React and Motion recipes, CSS adapters for existing primitives, and adaptation notes; it needs no runtime agent infrastructure.

## Choose the work

“Discover,” “review,” “apply,” and “refine” are natural-language requests, not installer commands.

- **Discover:** Inspect the relevant host interface, then search the kit by action or use case. Read [catalog.json](https://bera-ui.vercel.app/transitions/manifest.json) for the complete index.
- **Review:** Read the host implementation and [motion guidance](https://bera-ui.vercel.app/transitions/motion.md). Explain concrete problems in onset, continuity, interruption, or settlement.
- **Apply:** Read [integration guidance](https://bera-ui.vercel.app/transitions/integration.md), then the selected catalog entry's `recipe`, `source`, and `styles` files. Choose between refining the host component and adding a standalone recipe.
- **Refine:** Read the existing implementation and [motion guidance](https://bera-ui.vercel.app/transitions/motion.md). Tune the smallest relevant parameters and validate the resulting interaction.

Use the catalog's actual IDs, use cases, dependencies, and paths. Its `transitions` are standalone recipes; its `adapters` apply motion to existing primitives. Load only the selected entry's guidance and declared files. Do not assume every entry includes a React component.

From this kit directory, run `node install.mjs search "submit" --category Feedback --json`. Search is read-only, matches every query word across names and use cases, and returns the existing recipe and source paths. Omit `--category` to search the whole kit. Use `node install.mjs list --json` to browse all entries; an empty search result is not a reason to invent a recipe ID.

For an existing Radix/shadcn dropdown, read [Radix menu motion](https://bera-ui.vercel.app/adapters/radix-menu-motion.agent.md). The CSS adapter preserves `Content` and `SubContent` and adds no dependencies. Confirm the primitive is Radix before applying it; the Base UI implementation has a different contract.

For an existing control, transfer the relevant motion into its implementation. For a new standalone component, use the kit installer or the [Bera shadcn registry](https://bera-ui.vercel.app/agents#registry). Read the source and integration boundary either way. Registry installation adds the original recipe; apply the selected settings in the consuming code afterward. Use existing shadcn tools when available and configured; neither the skill nor the registry requires a Bera MCP server.

## Keep the host in charge

Inspect the host's component, state owner, event handlers, focus behavior, fonts, tokens, and installed dependencies before editing. Preserve Radix/shadcn semantics, controlled inputs, portals, dismissal, and application callbacks. Carry the selected motion into existing markup where practical; standalone source and CSS are available when a new component fits the task. Use the supplied React/Motion or CSS path without adding another animation engine.

For standalone recipes, keep `preview={false}` and natural sizing in production. Carry only settings that affect the selected recipe: `speed` adjusts motion timing, and `radius` applies to configurable surfaces. Retain legible, unscaled text during surface changes. Match the host's token format in the copied styles; do not rewrite its global theme to fit a recipe.

Outside the gallery, **StateButton requires a real `onAction`**. **ToastStack is a local notification demonstration**: adapt its motion to the host's notification provider. Report success only after the real operation succeeds. Replay must not repeat side effects or move focus from the user's current control.

Validate reduced motion, rapid reversal, keyboard focus, and real operation outcomes before calling the integration complete.

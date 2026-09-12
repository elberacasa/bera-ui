---
name: bera-motion
description: Discover, review, apply, or refine reusable React interface transitions from the Bera motion kit. Use for motion in existing controls and surfaces while preserving the host application's behavior and styling.
---

# Bera motion

Start with the user's action and the states it connects. Improve that transition within the existing interface. This kit supplies React and Motion source, styles, and adaptation notes; it needs no runtime agent infrastructure.

## Choose the work

“Discover,” “review,” “apply,” and “refine” are natural-language requests, not installer commands.

- **Discover:** Read [catalog.json](catalog.json), inspect the relevant host interface, and identify the closest recipe by use case.
- **Review:** Read the host implementation and [motion guidance](references/motion.md). Explain concrete problems in onset, continuity, interruption, or settlement.
- **Apply:** Read [integration guidance](references/integration.md), then the selected catalog entry's `recipe`, `source`, and `styles` files. Choose between refining the host component and adding a standalone recipe.
- **Refine:** Read the existing implementation and [motion guidance](references/motion.md). Tune the smallest relevant parameters and validate the resulting interaction.

Use the catalog's actual IDs, use cases, dependencies, and paths. Load only the selected recipe and its source and styles; the catalog is the pattern inventory.

For an existing control, transfer the relevant motion into its implementation. For a new standalone component, use the kit installer or the [Bera shadcn registry](https://bera-ui.vercel.app/agents#registry). Read the source and integration boundary either way. Registry installation adds the original recipe; apply the selected settings in the consuming code afterward. Use existing shadcn tools when available and configured; neither the skill nor the registry requires a Bera MCP server.

## Keep the host in charge

Inspect the host's component, state owner, event handlers, focus behavior, fonts, tokens, and installed dependencies before editing. Preserve Radix/shadcn semantics, controlled inputs, portals, dismissal, and application callbacks. Carry the selected motion into existing markup where practical; standalone source and CSS are available when a new component fits the task. Use React and Motion without adding another animation engine.

Keep `preview={false}` and natural sizing for production. Carry only settings that affect the selected recipe: `speed` adjusts motion timing, and `radius` applies to configurable surfaces. Retain legible, unscaled text during surface changes. Match the host's token format in the copied styles; do not rewrite its global theme to fit a recipe.

Outside the gallery, **StateButton requires a real `onAction`**. **ToastStack is a local notification demonstration**: adapt its motion to the host's notification provider. Report success only after the real operation succeeds. Replay must not repeat side effects or move focus from the user's current control.

Validate reduced motion, rapid reversal, keyboard focus, and real operation outcomes before calling the integration complete.

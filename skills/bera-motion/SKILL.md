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
- **Apply:** Read [integration guidance](references/integration.md), then the selected catalog entry's `recipe`, `source`, and `styles` files. Adapt only the motion needed for the requested interaction.
- **Refine:** Read the existing implementation and [motion guidance](references/motion.md). Tune the smallest relevant parameters and validate the resulting interaction.

The nine patterns cover action status (**State Button**), changing labels (**Text Swap**), clipboard confirmation (**Copy Feedback**), active selection (**Sliding Tabs**), search disclosure (**Expanding Search**), numeric changes (**Rolling Counter**), menu disclosure (**Morphing Menu**), section disclosure (**Accordion**), and notification arrival/dismissal (**Toast Stack**). Use the catalog's actual IDs and paths; it is the source of truth. Load only the chosen `references/<id>.md` and `recipes/<id>.tsx` plus `.css`.

## Keep the host in charge

Inspect the host's component, state owner, event handlers, focus behavior, fonts, tokens, and installed dependencies before editing. Preserve Radix/shadcn semantics, controlled inputs, portals, dismissal, and application callbacks. Carry the selected motion into existing markup where practical; standalone source and CSS are available when a new component fits the task. Use React and Motion without adding another animation engine.

Keep `preview={false}` and natural sizing for production. Adapt the documented `speed` and `radius` parameters to the host; retain legible, unscaled text during surface changes.

Outside the gallery, **StateButton requires a real `onAction`**. **ToastStack is a local notification demonstration**: adapt its motion to the host's notification provider. Report success only after the real operation succeeds. Replay must not repeat side effects or move focus from the user's current control.

Validate reduced motion, rapid reversal, keyboard focus, and real operation outcomes before calling the integration complete.

# Roadmap

The collection grows through useful interface actions and strong integration examples. GitHub issues track implementation status; the priorities below describe the intended outcomes.

## Ecosystem priorities

- **Existing components first.** Provide small integrations that apply motion to a host primitive and show exactly which state, callbacks, and accessibility behavior remain with the host.
- **Consistent distribution.** Generate skill guidance, downloads, the shadcn registry, and discovery indexes from authored recipe and adapter metadata. Keep standalone components distinct from adapters for existing primitives, with accurate files, dependencies, and integration boundaries.
- **Reliable consumer installs.** Verify direct URL and configured namespace installs in representative React projects. Cover component aliases, local CSS imports, host tokens, and dependency changes.
- **Focused agent context.** Route an agent from the index to one relevant recipe, with working source links and clear application requirements. Add discovery formats only when a consumer can use them.

## Integration priorities

The [integration milestone](https://github.com/elberacasa/bera-ui/milestone/1) groups these tasks:

| Task                                                                             | Acceptance criteria                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#1 · Existing shadcn menu](https://github.com/elberacasa/bera-ui/issues/1)      | Verify the [Radix menu adapter](../skills/bera-motion/references/radix-menu-motion.md) with real commands, submenu collision handling, finite exit, focus return, and reduced motion. |
| [#2 · Notification provider](https://github.com/elberacasa/bera-ui/issues/2)     | Connect stack motion to a real provider without changing expiry, pause behavior, announcements, or dismissal semantics.                                                               |
| [#3 · Reduced motion and themes](https://github.com/elberacasa/bera-ui/issues/3) | Exercise each recipe with reduced motion and representative host themes. Verify final state, contrast, keyboard behavior, and narrow layouts.                                         |
| [#4 · Focused CSS downloads](https://github.com/elberacasa/bera-ui/issues/4)     | Include only the selected recipe's required styles while preserving source parity and consumer behavior.                                                                              |

## Pattern priorities

Candidate additions must include directly interactive examples, complete source, and a clear integration contract. These are directions for new work, not a list of released features.

- **SVG state morphs:** connect meaningful icon states, extending the menu/close recipe to play/pause and other useful toggles, with consistent optical weight and reversible path motion.
- **Button state morphs:** connect idle, pending, success, and retry states while preserving the real action's lifetime and the host button's semantics.
- **Inline editing:** carry a label into an editable state, then resolve confirmation or cancellation without losing focus or context.
- **List changes:** animate insertion, removal, and reordering while keeping item identity, reading order, and keyboard navigation intact.
- **Expanded number ranges:** define behavior for signed values and changing digit counts before extending the counter's documented bounds.

Use the [motion proposal form](https://github.com/elberacasa/bera-ui/issues/new?template=motion.yml) to propose a pattern or a focused refinement. Link the interface use case and describe observable acceptance criteria.

## Ready to release

A pattern belongs in the collection when its action is clear, its normal playback feels immediate, and interruptions settle correctly. It must support keyboard input, reduced motion, and narrow layouts. Its distributed source must match the gallery, and its integration guidance must identify the real state, callbacks, and accessibility behavior the host retains.

See [QUALITY.md](QUALITY.md) for the checks used to assess an implementation and [CONTRIBUTING.md](../CONTRIBUTING.md) for the delivery workflow.

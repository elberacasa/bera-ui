# What we learned from transitions.dev

The product reference is a motion recipe collection for interfaces that already exist. Its real strength is the combination of visible demonstrations, implementation detail, and agent guidance.

Research on September 12, 2026 covered the [skill documentation](https://transitions.dev/skill.html), [refinement documentation](https://transitions.dev/refine.html), and the public repository's [main skill](https://github.com/Jakubantalik/transitions.dev/blob/main/skills/transitions-dev/SKILL.md), [recipe CLI](https://github.com/Jakubantalik/transitions.dev/blob/main/cli/bin/transitions-dev.mjs), [dropdown recipe](https://github.com/Jakubantalik/transitions.dev/blob/main/skills/transitions-dev/05-menu-dropdown.md), and [recipe generator](https://github.com/Jakubantalik/transitions.dev/blob/main/build/extract.mjs).

## How the reference works

- The gallery demonstrates a state change and the motion connecting it.
- The skill helps an agent choose a recipe, read the host component, and preserve its existing behavior.
- The recipe CLI copies recipe Markdown; integration remains the coding agent's responsibility.
- Discover/reveal, review, apply, refine, and polish are agent workflow concepts. They should not be presented as executable CLI commands unless the actual CLI supports them.
- The separate refinement tool uses a development relay and timeline instrumentation. It is an additional tool, not a prerequisite for adopting a transition.
- Generating recipes from demonstration source helps prevent documentation drift.

## Bera's current implementation

Bera generates each standalone component, its matching namespaced CSS, the catalog, full agent brief, and portable kit from the live implementation and one authored catalog. The kit's local installer copies source safely and reports missing dependencies; the coding agent connects real behavior and adapts motion to existing primitives.

The customizer adds live tempo and corner settings. Copy for agent includes the chosen settings and full selected source; slow playback remains an inspection aid. The open skills CLI can discover and install `bera-motion` directly from this public repository.

This edition has nine patterns. It does not claim the reference's live timeline editing capabilities, and it does not claim a measured aesthetic or performance advantage. Its next proof is adoption in real host applications, tracked in the roadmap.

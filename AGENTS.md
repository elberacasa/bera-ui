# bera/ui

Build reusable React transitions for existing interfaces. Each recipe combines useful behavior, deliberate motion, editable source, and clear integration boundaries. The gallery demonstrates the same source that the kit distributes.

## Design contract

- Start with an ordinary action and the states it connects. Consider onset, sequencing, continuity, interruption, reversal, and settlement.
- Use a continuous black canvas, neutral borders, clear typography, and the bera/ui SVG mark. Give each interaction space; avoid decorative containers and ambient effects unrelated to its action.
- Every pattern needs an obvious use case, direct interaction, replay, slow playback, source inspection, and integration guidance.
- Keep text sharp as surfaces change shape. SVG morphs must retain legible endpoints and interpolate intentionally between them.
- Preserve keyboard behavior, focus, controlled state, and reduced motion. Rapid repeated input must settle to the latest intended state.
- Label demonstration simulations. Report success only after the real operation succeeds. Replay changes presentation without repeating application side effects or moving focus.
- Keep the host application's content, fonts, tokens, state ownership, and accessibility primitives when adapting a recipe. Use React and Motion; avoid introducing a second animation engine.

## Source map

- `components/transitions/`: transition implementations and local CSS.
- `components/adapters/`: CSS motion layers for existing host primitives.
- `components/integrations/` and `app/integrations/`: live examples using real host actions and state.
- `components/motion-comparison.tsx` and `components/comparisons/`: synchronized before/after examples. Enhanced previews import the shipped recipes; instant baselines retain the same content, styling, semantics, and state.
- `lib/transition-catalog.json`: authored pattern metadata, props, and integration guidance.
- `lib/adapter-catalog.json`: authored host adapter metadata and source paths.
- `components/transition-library.tsx`: collection, filters, playback, and per-pattern settings.
- `components/transition-inspector.tsx`: customization, source inspection, and agent handoff.
- `app/transition-library.css`: gallery presentation; never a dependency of copied components.
- `scripts/sync-components.mjs`: generates source downloads, recipes, metadata, and the portable archive.
- `skills/bera-motion/`: authored skill, installer, reference guidance, and generated recipes.
- `public/transitions/`: generated downloads and machine-readable manifest.
- `app/studies/iris/` and `components/iris/`: isolated Iris route and implementation.

## Distribution contract

Each downloaded TSX file exports only its selected component and includes the helpers it needs. Its local stylesheet travels with it. Production imports omit `preview`; gallery framing and demonstration controls remain opt-in. Connect actual data and callbacks, and document any reference-only behavior.

Host adapters are separate catalog entries. The Radix menu adapter distributes one CSS file and introduces no packages or replacement primitives. Preserve the host's mounting lifecycle, portals, positioning, state, and callbacks. Its live example's responsive placement and theme controls belong to the demonstration, not the adapter.

Export only settings that affect the chosen transition. `speed` controls motion timing; `radius` applies where the pattern has a configurable surface. Slow playback is an inspection control and stays separate from exported settings.

Edit live source and the authored catalog, then run `npm run generate`. Do not hand-edit generated recipes or downloads. Keep the skill concise and route detailed guidance to its reference files. The installer must preserve differing destination files, support inspection before writing, and report missing dependencies without installing them.

## Quality and delivery

Follow [CONTRIBUTING.md](CONTRIBUTING.md), [docs/DESIGN.md](docs/DESIGN.md), and [docs/QUALITY.md](docs/QUALITY.md). Verify changed interactions in the browser at desktop and narrow phone widths, with keyboard input, reduced motion, interruptions, and real operation outcomes. Check source/download parity for export changes.

Use Node.js 22.x, version 22.13 or newer. Required checks are `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:kit`, and `npm run build`.

GitHub is the source repository and Vercel owns deployment. Use focused branches, conventional commits, and pull requests. GitHub Actions validates changes; Vercel provides previews and production deployments. Do not rewrite `main` or add another deployment path. Report verification results in the pull request, distinguishing checks performed from remaining limits.

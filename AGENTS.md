# bera/ui

Build a library of reusable transitions for existing interfaces. The reference is transitions.dev: the product is a collection of exceptional motion patterns, not one new UI object. The user explicitly corrected the scope after the Iris experiment and the single Origin Popover gallery. Preserve Iris at `/studies/iris` as an earlier study.

## Product and taste

- Start with ordinary actions; refine how states connect. Motion is the primary product.
- Dark black shadcn-style surfaces, neutral borders, legible typography, plain `bera/ui` wordmark. No star/sparkle logo.
- Every transition needs a clear use case, direct interaction, source inspection, slow playback, and integration guidance.
- Tune onset, sequencing, continuity, reversal, and settlement. Avoid unrequested ambient loops or spectacle unrelated to the action.
- Keep text unscaled as surfaces change size. Respect reduced motion, keyboard focus, and rapid repeated input.
- Demo simulations must be explicitly labeled. Real actions, such as copy, report success only after actual success. Replay must never repeat a real application action or take focus from the user's current control.
- Agent-first means complete source and styles, clear adaptation boundaries, and useful props. No runtime agent infrastructure is needed to copy a transition.
- Use React and Motion for this collection, with host fonts, tokens, and behavior. Do not add another animation engine for ordinary patterns.

## Files

- `components/transition-library.tsx`: gallery registry, filters, playback, per-pattern settings.
- `components/transition-inspector.tsx`: live customization, individual source, complete agent handoff.
- `skills/bera-motion/`: portable skill and installer; recipes/catalog are generated.
- `lib/transition-catalog.json`: the single authored catalog.
- `components/transitions/feedback.tsx` and `.css`: state button, text swap, copy feedback.
- `components/transitions/selection.tsx` and `.css`: sliding tabs, expanding search, rolling counter.
- `components/transitions/surfaces.tsx` and `.css`: morphing menu, accordion, toast stack.
- `app/transition-library.css`: gallery-only appearance. It is not a dependency of the downloadable modules.
- `scripts/sync-components.mjs`: synchronizes downloadable source and complete agent briefs before build.
- `public/transitions/`: generated downloads and machine-readable manifest.
- `components/origin-popover/`: earlier small primitive retained as source, not the library's central direction.
- `app/studies/iris/`, `components/iris/`, `docs/studies/IRIS.md`: preserved experiment.

## Quality and delivery

Judge the live transitions at desktop and narrow phone widths. Check keyboard navigation, focus return, menu dismissal, controlled inputs, interruption, bounds, copy outcomes, reduced motion, and source/download parity. Run TypeScript, relevant lint, and production compilation. Update the validation record with what was actually checked. Preserve `.openai/hosting.json` and the existing Site project. The primary public deployment is now Vercel, connected to the public MIT GitHub repository `elberacasa/bera-ui`. Keep the Sites build available, but do not create another Site. Vercel Git integration owns deployments; GitHub Actions owns validation. Use a feature branch, conventional commits, a focused PR, and passing required checks before merging. Do not rewrite main.

## Agent distribution

Every component defaults to natural sizing; `preview` opts into gallery framing and demo controls. `speed` and `radius` are integration settings. Slow gallery playback is separate. Read CONTRIBUTING.md for generation and validation; never hand-edit generated recipe files. Every downloaded TSX exports only its selected component. The installer preserves differing files and never installs dependencies. Keep the SKILL.md concise; longer motion and integration guidance belongs in references.

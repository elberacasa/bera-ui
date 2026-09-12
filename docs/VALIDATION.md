# Validation — transition collection

## Agent kit edition — September 12, 2026

- All nine downloaded TSX modules compile as strict standalone consumers with only one named export.
- The portable kit passes 25 integration checks: installer safeguards, four agent destinations, archive extraction, public-source parity, and deterministic generation.
- Whole-project TypeScript, ESLint, and formatting checks pass.
- The Vercel static build produces the gallery, agent guide, Iris study, and downloadable kit.
- Browser check at 668px: customizer presets and keyboard corner adjustment appear in the full agent brief; closing returns focus to the exact opener; the agent guide and its links render correctly.
- The save button is disabled without a real callback outside preview. TextSwap without application statuses renders nothing outside preview.

The earlier detailed browser checks below apply to V1. This edition does not imply a fresh physical-device or cross-engine certification.

## Independent integration and delivery checks

- Installed the skill from the public repository with the real `skills` CLI in a temporary project. It discovered one skill and copied the complete kit into `.agents/skills/bera-motion`.
- An independent coding agent used the installed local skill to adapt an existing clipboard button. Strict TypeScript and AST checks confirmed its API, real clipboard handler, failure/cancellation logic, fallback, live region, and host light-theme tokens were preserved. Browser clipboard execution was not part of this fixture test.
- GitHub CI passes typecheck, lint, formatting, all 25 kit checks, and the Vercel static build on Node 22/Linux. The portable archive compares exact decompressed content across runtimes and exact compressed bytes across repeat builds on the same runtime.
- Vercel Git integration created branch previews; merging the checked PR triggered a main-branch production deployment. Main protection enforces the five CI checks plus Vercel, including for administrators.
- The existing Sites/Cloudflare build also passes. Vercel is the primary public deployment; the previous private Site is retained.

## Browser checks

The nine-pattern collection was exercised in the Codex browser at desktop widths (1280 and 1440), a 390px phone viewport, and a 320px narrow phone viewport.

- Category filters render the corresponding three patterns; All restores all nine.
- Sliding tabs support ArrowRight and End; selected panels and accessible state follow selection.
- Expanding search accepts text, filters the demonstration data, and closes with Escape. Replay opens the surface without moving focus away from the gallery control.
- Counter increment/decrement settled to the expected value after rapid changes. Source-level arithmetic checks also covered forward and reverse jumps, wrapping, overshoot, and 1,000 interrupted steps.
- Morphing menu opens from its trigger. Keyboard ArrowDown and Enter activated Pin and restored focus. The expanded surface stayed inside the preview at 320px after adjusting its inset.
- Toasts cap the settled stack at three. Only the front toast is interactive; dismissal reveals the next.
- Accordion changes leave exactly one heading expanded and hide the previous panel; rapid switches settle correctly.
- State button demonstrates the labeled simulated save. Copy feedback reports the actual successful clipboard write. Text swap advances its status.
- The source inspector contains full implementation text. “For your agent” includes React and CSS; copying succeeded. Escape returned focus to the exact code button that opened it.
- Source inspector remains inside its frame at desktop and phone widths. The 320px and 390px document widths match their viewports.
- Normal and 0.35× playback were inspected. Reduced-motion branches, CSS overrides, and interruption cleanup were reviewed in source.
- The preserved Iris study renders independently at `/studies/iris`, including at 320px. Its previous controls and WebMCP tools remain available.

## Automated checks

- TypeScript `tsc --noEmit`: passed.
- ESLint on the gallery, transition modules, route/layout, and synchronization script: passed without warnings.
- Production compilation: passed.
- Downloadable source and styles are synchronized from the live modules. Complete per-pattern agent briefs and the nine-entry manifest are generated before every build.

## Limits

These are browser viewport checks, not certification on physical phones or every browser engine. OS reduced-motion behavior and clipboard denial are implemented and source-reviewed; the browser path exercised used normal OS motion and successful clipboard permission. Real network save callbacks and custom host application integrations require validation in their destination project. This edition is an initial collection, not a comparative claim of superiority to every existing animation library.

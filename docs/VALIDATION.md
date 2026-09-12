# Validation — transition collection

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

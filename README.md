# bera/ui

A dark collection of reusable transitions for existing interfaces. Nine interactive patterns, slow playback, source inspection, and complete coding-agent briefs. Built with React and Motion.

## The collection

- **Feedback:** StateButton, TextSwap, CopyButton.
- **Navigation:** SlidingTabs, ExpandingSearch, RollingCounter.
- **Surfaces:** MorphingMenu, Accordion, ToastStack.

The homepage is a working gallery. Each code button opens the exact React and CSS used by its example. “For your agent” includes both files and instructions for adapting the selected interaction. Downloads live under `/transitions/`; the manifest is at `/transitions/manifest.json`.

## Reuse

Copy the selected group module and its CSS into a React project with `motion` and `lucide-react`. The modules import their own stylesheet. Keep the desired export, remove the demo frame and sample content, then connect the host application's real state and actions. The gallery CSS is not required. Adapt the neutral tokens to the host design.

```tsx
import { SlidingTabs } from './selection';

<SlidingTabs
  ariaLabel="Project views"
  items={views}
  value={view}
  onValueChange={setView}
/>
```

`speed={1}` is normal playback. `speed={0.35}` and `replayKey` support studying an example. Replay never performs a clipboard write or repeats a real save. The simulated save is visibly labeled. Reduced motion follows the OS setting.

## Develop

```sh
npm install
npm run dev
npx tsc --noEmit
npm run build
```

The prebuild step synchronizes downloadable source, styles, and agent briefs. Read `AGENTS.md` and `docs/DESIGN.md` before extending the collection. `docs/VALIDATION.md` records actual checks and limits.

The original Iris experiment remains at `/studies/iris`. It contributes no graphics code to the homepage. Manrope is bundled under the SIL Open Font License in `public/fonts/OFL.txt`.

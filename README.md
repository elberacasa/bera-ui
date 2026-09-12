# bera/ui

**Transitions for interfaces people already use.**

[Live collection](https://bera-ui.vercel.app) · [Agent guide](https://bera-ui.vercel.app/agents) · [MIT licensed](LICENSE)

[![CI](https://github.com/elberacasa/bera-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/elberacasa/bera-ui/actions/workflows/ci.yml)

A collection of nine interactive motion patterns for React. Try a transition, tune its tempo and corners, then take its source into your project—or hand the complete recipe to your coding agent.

The components use Motion, local CSS, and your application's fonts and colors. The copied source stays editable in your project. There is no Bera runtime service and no account required to use the downloaded kit.

## Start here

| I want to…                                  | Start with…                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Explore and customize motion                | Open the [live gallery](https://bera-ui.vercel.app) and choose a card’s customize control. |
| Add one transition to a React app           | [Install a component](#install-a-component).                                               |
| Let my coding agent choose and adapt motion | [Install the agent skill](#use-with-a-coding-agent).                                       |
| Improve or contribute a pattern             | Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [roadmap](docs/ROADMAP.md).                |

## Run the gallery

Use Node.js **22.x (22.13 or newer)** and npm.

```sh
git clone https://github.com/elberacasa/bera-ui.git
cd bera-ui
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). Every card supports direct interaction and replay. Open its customize control for live tempo and corner settings, React and CSS source, and a complete agent brief. Slow playback helps inspect the motion; it is separate from the settings you export.

The [agent guide](http://localhost:5173/agents) includes a downloadable kit. After extracting `bera-motion.tar.gz`, its installer works locally without downloading packages or contacting a service.

## Install a component

From this repository, point the installer at your existing application:

```sh
node skills/bera-motion/install.mjs list
node skills/bera-motion/install.mjs add sliding-tabs --project ../your-app
```

Replace `../your-app` with your app's path. This copies `sliding-tabs.tsx` and `sliding-tabs.css` into its `components/bera` directory. Use `--dir src/components/bera` if your app keeps source under `src`.

The installer reports required dependencies without modifying `package.json` or running your package manager. Install any missing dependencies in the destination app; the collection uses React, `motion`, and `lucide-react`.

```tsx
"use client";

import { useState } from "react";
import { SlidingTabs } from "./components/bera/sliding-tabs";

export function ProjectViews() {
  const [view, setView] = useState("overview");

  return (
    <SlidingTabs
      ariaLabel="Project views"
      items={[
        {
          value: "overview",
          label: "Overview",
          content: <p>Project overview</p>,
        },
        {
          value: "activity",
          label: "Activity",
          content: <p>Recent activity</p>,
        },
      ]}
      value={view}
      onValueChange={setView}
      speed={1}
      radius={12}
    />
  );
}
```

Adjust the import for the file's location. Each transition imports its own stylesheet; the gallery stylesheet is unnecessary. Normal imports use natural sizing. `preview` opts into gallery framing and demonstration controls, so leave it off in your application.

Use `--dry-run` to inspect changes or `--json` for structured output. Existing identical files are kept. Different files cause the installer to stop without overwriting your work. Copied files are yours to maintain; installing a new kit is not an automatic merge of your customizations.

## Use with a coding agent

From your application directory, install the skill through the open skills CLI:

```sh
npx skills add elberacasa/bera-ui --skill bera-motion
```

Or install the full kit locally from this repository into the destination project’s skill directory:

```sh
node skills/bera-motion/install.mjs skill --project ../your-app --agent codex
```

Supported destinations are `codex`, `claude`, `cursor`, and `copilot`. For an extracted download, use `node bera-motion/install.mjs` instead. The standalone installer needs Node.js 18 or newer; running this repository still needs Node.js 22.x (22.13 or newer).

Then ask your agent:

> Use bera-motion to refine the tabs in our project settings. Keep the current layout, colors, content, and keyboard behavior. Start with sliding-tabs, use tempo 1.15 and radius 8, and connect the motion to the existing selected value. Check fast repeated changes and reduced motion.

The skill gives your agent source, recipes, a catalog, and integration rules. It can install a standalone component or transfer the relevant motion into an existing shadcn/Radix component. The agent performs the integration in your codebase; the installer itself only copies files.

For a single interaction, you can also use **Copy for agent** in the gallery. That includes the chosen settings, the selected component's source and styles, and the relevant integration guidance.

## The collection

| Transition ID      | Use it for                      | Connect it to                                  |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| `state-button`     | Save and submit feedback        | The real asynchronous `onAction` callback.     |
| `sliding-tabs`     | Switching views or modes        | `items`, `value`, and `onValueChange`.         |
| `morphing-menu`    | A compact set of nearby actions | Your menu actions and existing focus behavior. |
| `text-swap`        | Short changing status messages  | Your `statuses` and selected `value`.          |
| `expanding-search` | Compact search or filtering     | The actual query, data, and submit handler.    |
| `toast-stack`      | Layering notification feedback  | Your existing toast provider's lifecycle.      |
| `copy-button`      | Copying text or a command       | The exact `text` to copy.                      |
| `rolling-counter`  | Adjustable integer quantities   | Your value, change handler, and range.         |
| `accordion`        | Revealing supporting details    | Your headings, content, and expanded value.    |

`ToastStack` is a motion reference, not a complete notification provider. The counter reference supports integers from 0–999. Demonstration data must be replaced with real application state. Preserve established accessibility primitives, validation, error handling, and notification lifecycles when adapting a recipe.

## Deployment and project workflow

The public gallery is [bera-ui.vercel.app](https://bera-ui.vercel.app). Vercel is connected to this repository: branch pushes create previews, and merges to `main` update the public site. No deployment token is required in GitHub Actions.

`main` requires a pull request, passing type, lint, formatting, kit, and production-build checks, plus a successful Vercel preview. Force pushes are disabled and merge history stays linear. Small conventional commits document changes; focused pull requests are squash-merged after validation.

See the [roadmap](docs/ROADMAP.md), [open tasks](https://github.com/elberacasa/bera-ui/issues), and [integration milestone](https://github.com/elberacasa/bera-ui/milestone/1). The [contribution guide](CONTRIBUTING.md) explains where to edit, regenerate, and verify a recipe.

## Develop and verify

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:kit
npm run build:vercel
```

`npm run dev` uses Next.js, matching the Vercel gallery. `npm run build` and `npm run dev:sites` retain the earlier Cloudflare/Sites target. Both production targets must generate the downloadable recipes from the live component source. Treat `public/transitions/` and the kit's generated recipes as build output; edit the components and catalog instead.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the pull request workflow, [docs/VALIDATION.md](docs/VALIDATION.md) for recorded checks and limits, and [docs/ROADMAP.md](docs/ROADMAP.md) for the next work.

## Project map

| Path                                  | Purpose                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| `components/transitions/`             | Live React implementations and local styles.              |
| `lib/transition-catalog.json`         | Pattern names, use cases, props, and adaptation guidance. |
| `components/transition-inspector.tsx` | Interactive tuning, source inspection, and agent handoff. |
| `skills/bera-motion/`                 | Portable skill, installer, recipes, and references.       |
| `scripts/sync-components.mjs`         | Generates downloads from the live source.                 |
| `public/transitions/`                 | Per-transition source, styles, metadata, and briefs.      |
| `app/studies/iris/`                   | Preserved Iris experiment, separate from the collection.  |

## Reference and attribution

[transitions.dev](https://transitions.dev/) inspired the focus on reusable motion for existing interfaces. Bera's implementation and integration workflow are developed in this repository. Read [docs/DESIGN.md](docs/DESIGN.md) for the design principles. The bundled Manrope font has its own [SIL Open Font License](public/fonts/OFL.txt).

## License

[MIT](LICENSE). Use, adapt, and ship the components in personal or commercial projects. Retain the license notice when redistributing source. Dependencies and the bundled font retain their respective licenses.

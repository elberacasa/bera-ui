<a href="https://bera-ui.vercel.app">
  <img src="assets/readme-cover.svg" alt="bera/ui — Every state, considered." width="100%" />
</a>

<p align="center">
  Reusable motion for the interfaces you already have.
</p>

<p align="center">
  <a href="https://bera-ui.vercel.app"><strong>Explore the collection</strong></a>
  ·
  <a href="https://bera-ui.vercel.app/agents">Agent guide</a>
  ·
  <a href="CONTRIBUTING.md">Contribute</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <a href="https://github.com/elberacasa/bera-ui/actions/workflows/ci.yml">
    <img src="https://github.com/elberacasa/bera-ui/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
</p>

## The detail is in the transition.

bera/ui is a motion library for React. Explore an interaction, adjust its feel, and bring the source into your product. Each recipe includes the component, its styles, and the guidance your coding agent needs to adapt it.

- **Try it.** Interactive previews, replay, and slow playback reveal how each transition works.
- **Tune it.** Adjust timing and shape, then carry your settings into the integration.
- **Make it yours.** Keep your components, content, design tokens, and application state.
- **Keep the source.** Copy a single React export and its CSS. Edit them in your own project.

## Install the skill

Run this from your application directory:

```sh
npx skills add elberacasa/bera-ui --skill bera-motion
```

Choose your coding agent when prompted. The skill includes the catalog, complete source, and integration recipes. It helps your agent apply motion to existing components or add a standalone transition.

For one interaction, open the [collection](https://bera-ui.vercel.app), customize a preview, and choose **Copy for agent**. The copied brief includes the source and your selected settings.

<details>
<summary><strong>Use a component directly</strong></summary>

Download the [portable kit](https://bera-ui.vercel.app/bera-motion.tar.gz) and extract it into your project root. Then install a selected transition:

```sh
node bera-motion/install.mjs add copy-button --project .
```

This creates `components/bera/copy-button.tsx` and its CSS. The installer reports missing dependencies; add them with your project's package manager. It requires Node.js 18 or newer, supports `--dry-run`, and preserves differing destination files.

```tsx
import { CopyButton } from "./components/bera/copy-button";

<CopyButton text="npm install motion" speed={1.15} radius={8} />;
```

Adjust the import to match your file's location. Components import their own CSS and use React and Motion; some use Lucide icons. Connect real data and callbacks. `preview` enables gallery framing, so leave it off in your application.

See the [agent guide](https://bera-ui.vercel.app/agents) for the complete local workflow and each recipe's integration notes.

</details>

## Develop

Use Node.js **22.x, version 22.13 or newer**.

```sh
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). Read the [contribution guide](CONTRIBUTING.md) for source generation, checks, and the pull request workflow. GitHub Actions validates changes; Vercel provides previews and the production gallery.

## Contribute

Refine an interaction, improve an integration, or propose a useful new pattern. Start with the [roadmap](docs/ROADMAP.md) and [open issues](https://github.com/elberacasa/bera-ui/issues).

## License

[MIT](LICENSE). Use and adapt the source in personal or commercial projects. Dependencies and the bundled [Manrope font](public/fonts/OFL.txt) retain their respective licenses.

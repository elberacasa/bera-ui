# Contributing to bera/ui

Help make an interface action clearer, more expressive, or easier to reuse. Contributions can refine a transition, add a useful pattern, improve an integration, or strengthen the kit. Read the [design principles](docs/DESIGN.md) and [quality standards](docs/QUALITY.md) before changing an interaction.

## Choose a focused change

Check the [roadmap](docs/ROADMAP.md) and [open issues](https://github.com/elberacasa/bera-ui/issues). For a new pattern, describe the action it serves, the states it connects, and how an application would use it. A small fix can go straight to a pull request.

Keep motion changes, dependency updates, and unrelated cleanup in separate reviews. Each pull request should demonstrate a clear before and after.

## Set up locally

Use Node.js **22.x, version 22.13 or newer**, and npm.

```sh
npm ci
npm run dev
```

The Next.js gallery runs at [localhost:5173](http://localhost:5173). The agent guide is at `/agents`. Keep `package-lock.json` synchronized with intentional dependency changes.

## Branches and commits

Start a short-lived branch from the current `main`. Use a name such as `fix/menu-focus-return`, `feat/svg-morph`, or `docs/agent-setup`. Fork the repository first if you do not have write access.

Keep commits cohesive and use conventional titles that describe the result:

```text
fix(menu): restore trigger focus after Escape
feat(motion): add a reversible SVG state transition
docs(kit): clarify component installation
```

Use `feat`, `fix`, `docs`, `test`, `refactor`, `build`, or `chore` as appropriate. Explain material decisions in the commit body. Do not commit secrets, local credentials, build directories, or editor state. Do not rewrite `main` or another contributor's branch history.

## Edit the source

| Path                                  | Responsibility                                          |
| ------------------------------------- | ------------------------------------------------------- |
| `components/transitions/`             | Live components and local styles.                       |
| `lib/transition-catalog.json`         | Discovery metadata, props, and adaptation guidance.     |
| `components/transition-inspector.tsx` | Customization, source inspection, and agent handoff.    |
| `app/transition-library.css`          | Gallery presentation.                                   |
| `skills/bera-motion/`                 | Installer and authored skill guidance.                  |
| `scripts/`                            | Source extraction, download generation, and kit checks. |

After changing a transition, its catalog entry, or the skill bundle, regenerate the distributed files:

```sh
npm run generate
```

Commit generated downloads and recipes with their source change. Do not hand-edit generated copies. A second generation should leave their contents unchanged.

## Verify the change

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:kit
npm run build
```

Use `npm run format` to apply repository formatting. Follow [docs/QUALITY.md](docs/QUALITY.md) for the relevant interaction and integration checks. Exercise real failure paths when they change, and add tests for meaningful behavior rather than tests that repeat implementation details.

For installer or export changes, use a temporary destination project. Install the selected transition, inspect a dry run, repeat the installation, and confirm that differing files remain intact. Verify the resulting consumer import and the application's actual behavior.

## Open a pull request

Target `main` and link the relevant issue. Explain the action or workflow that improves, describe its resulting behavior, and list checks actually performed. For motion changes, include a short recording or precise interaction steps. Include desktop and phone evidence when layout changes.

Keep application semantics, keyboard focus, reduced motion, and integration guidance part of the review. Note any unverified behavior explicitly. Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) and resolve required checks before merging.

GitHub Actions runs validation. Vercel provides branch previews and deploys `main` to production through its Git integration. Maintainers squash focused pull requests using their conventional titles; deployment credentials do not belong in pull requests or source files.

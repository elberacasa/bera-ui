# Contributing to bera/ui

The best contribution makes an ordinary action feel clearer and more considered. Improve a transition's continuity, timing, accessibility, or integration before adding another pattern. Read [AGENTS.md](AGENTS.md) and [docs/DESIGN.md](docs/DESIGN.md) first.

## Choose a focused change

Use an issue to describe a bug, a useful motion pattern, or a concrete task from the [roadmap](docs/ROADMAP.md). For a new pattern, explain the interface action it serves and why the existing collection does not cover it. A small fix can go straight to a pull request.

Avoid bundling visual redesigns, dependency upgrades, unrelated cleanup, and motion changes into one review. A pull request should have a clear before and after that can be demonstrated.

## Local setup

Use Node.js 22.x (22.13 or newer) and npm. Keep `package-lock.json` in sync with intentional dependency changes.

```sh
npm ci
npm run dev
```

The gallery runs at [localhost:5173](http://localhost:5173). The agent documentation is at `/agents`; the preserved Iris study is at `/studies/iris`.

## Branches and commits

Start a short-lived branch from the current `main`, using a name such as `fix/menu-focus-return`, `feat/counter-signed-values`, or `docs/agent-setup`. Fork the repository first if you do not have write access.

Keep each commit cohesive and buildable when practical. Use a concise conventional title describing its result:

```text
fix(menu): restore trigger focus after Escape
feat(kit): support a custom component directory
docs(agents): clarify how to adapt an existing primitive
```

Use `feat`, `fix`, `docs`, `test`, `refactor`, `build`, or `chore` as appropriate. Add a body when a decision or compatibility tradeoff needs explanation. Do not commit secrets, local credentials, generated build folders, or editor state. Do not rewrite `main` or someone else's branch history.

When the change is ready, open a pull request against `main`. Link its issue, explain the user-visible behavior, and include the checks you actually ran. Prefer a short screen recording for motion changes; include a phone-width view when layout changes. Maintainers can squash a focused pull request using its conventional title.

## Where to edit

- Change implementations and local styles in `components/transitions/`.
- Change discovery and integration guidance in `lib/transition-catalog.json`.
- Change gallery-only presentation in `app/transition-library.css`.
- Change installer behavior or authored skill guidance in `skills/bera-motion/`.
- Change extraction and download generation in `scripts/`.

Run `node scripts/sync-components.mjs` after editing a transition, its catalog entry, or the skill bundle. Generated downloads and extracted recipes should be committed alongside the source change. Do not hand-edit these generated copies. A clean regeneration should leave no further differences.

## Motion review

For a changed interaction, check the whole sequence: initial response, movement, settlement, interruption, and reversal. Repeated input should reach the latest intended state. Text should stay sharp as surfaces change size.

Use the actual keyboard path as well as pointer input. Check focus entry and return, Escape and outside dismissal where relevant, controlled values, and closed content that contains interactive elements. Inspect desktop and narrow phone layouts, including 320px width. Verify reduced motion without relying only on slow playback.

Connect real callbacks in the integration you are testing. A replay control must not save data, write to the clipboard, or take focus. Demonstration simulations need a visible label. Confirm success only after the real operation succeeds; exercise the failure path when it changes.

An existing host component's behavior comes first. Keep its accessibility primitive, fonts, tokens, data, validation, and focus management. Use the existing motion engine when practical. Do not add runtime agent infrastructure for a source recipe.

## Required checks

```sh
npm run typecheck
npm run lint
npm run test:kit
npm run build:vercel
```

Run `npm run build` for changes that affect the existing Cloudflare/Sites target. If a change touches shared application or build code, check both targets.

For installer or export changes, verify the resulting kit in a temporary destination project: install only the selected transition, exercise `--dry-run`, repeat the install, and confirm that differing files are preserved. Test a real consumer import and meaningful behavior or failure cases. Avoid tests that merely repeat implementation details.

Record significant new validation in [docs/VALIDATION.md](docs/VALIDATION.md), including the environment and any limits. Do not claim a browser or device was checked unless it was.

## A useful pull request

A reviewer should be able to answer three questions: what ordinary action improved, what changed in its behavior, and how was that verified? Use the pull request template, keep the scope small, and distinguish completed work from proposed follow-ups.

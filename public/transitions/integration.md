# Integrate a recipe

Read the target component and its callers first. Identify which state is controlled by the application, which element owns focus, and which handler performs the real action. Check the host's React setup, Motion dependency, design tokens, and CSS conventions.

Read the selected entry in the [catalog](https://bera-ui.vercel.app/transitions/manifest.json), then follow its recipe, source, and styles URLs relative to https://bera-ui.vercel.app. Treat the complete source as an inspectable starting point. The recipe notes define props and adaptation boundaries.

## Choose an integration route

- **Refine an existing interface.** Retain Radix/shadcn primitives, accessible roles, trigger/content relationships, controlled state, keyboard handling, portals, and focus return. Apply the relevant motion to existing elements, respecting their mounting lifecycle for exit animations. For custom components, retain the public API and application state owner. Transfer only the needed animation and styles.
- **Add a standalone component.** Install or copy the selected TSX and CSS together. Confirm imports, client component boundaries, and documented dependencies. Keep the local CSS import connected. Read the recipe's integration notes before connecting it to the application.

Production defaults are `preview={false}` and natural sizing. Keep gallery frames, fixed demonstration bounds, and sample data out of the application flow. Use `speed` according to the recipe's documented timing semantics and `radius` where the pattern has a configurable surface. Gallery slow playback is an inspection setting. Installs contain the original source; pass selected customization as props in the consuming code.

For **StateButton**, provide the application's real `onAction` and propagate its completion or failure. For **Copy Feedback**, reflect the actual clipboard result. **ToastStack** uses local demonstration state; transfer its arrival, stacking, and dismissal behavior to the existing notification provider, preserving that provider's announcement and lifecycle behavior. Keep demo simulations explicitly labeled wherever retained.

## Host styles

Recipes inherit host fonts and read tokens such as `--foreground`, `--popover`, and `--border` as complete CSS colors. This matches current Tailwind v4/shadcn themes using values such as `oklch(...)`. They also use modern CSS features including `color-mix()`.

Older themes may store raw channels such as `--foreground: 0 0% 98%`. In that case, adapt the recipe's local token mapping to `hsl(var(--foreground))`, and do the same for the other raw-channel tokens it reads. Preserve the host's global declarations. Check both light and dark states after adapting the mapping; fallback colors alone do not establish theme compatibility.

## shadcn registry

From a React application with shadcn configured, install a selected recipe:

```sh
npx shadcn@latest add https://bera-ui.vercel.app/r/copy-button.json
```

The registry puts TSX and CSS together under `bera/` in the host's configured components directory and declares the recipe's package dependencies. It contains no global theme changes or replacement UI primitives. Review any dependency changes using the host's package manager and version constraints.

For namespaced installation, merge `"@bera": "https://bera-ui.vercel.app/r/{name}.json"` into `components.json`'s existing `registries` object, then use `npx shadcn@latest add @bera/copy-button`. Preserve the rest of the configuration. Use the selected catalog ID in place of `copy-button`.

When the host's coding agent has the [shadcn MCP server](https://ui.shadcn.com/docs/mcp) configured, it can browse, search, and install from the configured registry. Use those existing tools if available. The skill supplies the adaptation guidance; installing it does not configure an MCP server or automatically register the namespace.

## Local installer

From the kit directory, replace `/path/to/app` with the existing project directory:

```sh
node install.mjs list --json
node install.mjs add state-button --project /path/to/app --dir components/bera --dry-run --json
node install.mjs add state-button --project /path/to/app --dir components/bera --json
node install.mjs skill --project /path/to/app --agent codex --json
```

`add` copies only the selected TSX/CSS and reports dependencies missing from the project's package manifest; it does not install packages. `skill` copies the full kit into the agent's project skill folder. Supported agents are `codex`, `claude`, `cursor`, and `copilot`; Codex is the default. Both commands support `--dry-run`, keep identical files, and stop on differing files. Resolve conflicts by inspecting the host changes before adapting or choosing another destination.

Run the host's relevant type, lint, and build checks. Verify the actual interaction at desktop and narrow phone widths, and report only checks performed.

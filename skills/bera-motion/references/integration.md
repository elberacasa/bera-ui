# Integrate a recipe

Read the target component and its callers first. Identify which state is controlled by the application, which element owns focus, and which handler performs the real action. Check the host's React setup, Motion dependency, design tokens, and CSS conventions.

Read the selected entry in `../catalog.json`, then its declared reference and source files. Standalone `transitions` contain React and CSS; `adapters` declare the files needed to refine an existing primitive. Treat the source as an inspectable starting point. The entry's guidance defines its API and adaptation boundaries.

## Choose an integration route

- **Refine an existing interface.** Retain Radix/shadcn primitives, accessible roles, trigger/content relationships, controlled state, keyboard handling, portals, and focus return. Apply the relevant motion to existing elements, respecting their mounting lifecycle for exit animations. For custom components, retain the public API and application state owner. Transfer only the needed animation and styles.
- **Add a standalone component.** Install or copy the selected TSX and CSS together. Confirm imports, client component boundaries, and documented dependencies. Keep the local CSS import connected. Read the recipe's integration notes before connecting it to the application.

For an existing Radix dropdown, use the [Radix menu CSS adapter](radix-menu-motion.md). It adds motion to the current content and submenu without requiring a new React component or Motion dependency. Preserve Radix's conditional mounting and finite exit lifecycle.

Standalone production defaults are `preview={false}` and natural sizing. Keep gallery frames, fixed demonstration bounds, and sample data out of the application flow. Use `speed` according to the recipe's documented timing semantics and `radius` where the pattern has a configurable surface. Gallery slow playback is an inspection setting. Installs contain the original source; pass selected customization as props in the consuming code.

For **StateButton**, provide the application's real `onAction` and propagate its completion or failure. For **Copy Feedback**, reflect the actual clipboard result. **ToastStack** uses local demonstration state; transfer its arrival, stacking, and dismissal behavior to the existing notification provider, preserving that provider's announcement and lifecycle behavior. Keep demo simulations explicitly labeled wherever retained.

## Host styles

Standalone recipes inherit host fonts and read tokens such as `--foreground`, `--popover`, and `--border` as complete CSS colors. This matches current Tailwind v4/shadcn themes using values such as `oklch(...)`. They also use modern CSS features including `color-mix()`. The Radix menu adapter supplies motion only and does not read or redefine color tokens.

Older themes may store raw channels such as `--foreground: 0 0% 98%`. In that case, adapt the recipe's local token mapping to `hsl(var(--foreground))`, and do the same for the other raw-channel tokens it reads. Preserve the host's global declarations. Check both light and dark states after adapting the mapping; fallback colors alone do not establish theme compatibility.

## shadcn registry

From a React application with shadcn configured, install a selected recipe:

```sh
npx shadcn@latest add https://bera-ui.vercel.app/r/copy-button.json
```

The registry puts a standalone recipe's TSX and CSS together under `bera/` in the host's configured components directory and declares its package dependencies. An adapter installs only its declared files; `radix-menu-motion` adds one CSS file and no dependencies. Registry items contain no global theme changes or replacement UI primitives. Review any dependency changes using the host's package manager and version constraints.

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

`add` copies the selected entry's files and reports declared dependencies missing from the project's package manifest; it does not install packages. `skill` copies the full kit into the agent's project skill folder. Supported agents are `codex`, `claude`, `cursor`, and `copilot`; Codex is the default. Both commands support `--dry-run`, keep identical files, and stop on differing files. Resolve conflicts by inspecting the host changes before adapting or choosing another destination.

Run the host's relevant type, lint, and build checks. Verify the actual interaction at desktop and narrow phone widths, and report only checks performed.

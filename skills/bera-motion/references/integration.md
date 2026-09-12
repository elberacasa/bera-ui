# Integrate a recipe

Read the target component and its callers first. Identify which state is controlled by the application, which element owns focus, and which handler performs the real action. Check the host's React setup, Motion dependency, design tokens, and CSS conventions.

Read the selected entry in `../catalog.json`, then its `../references/<id>.md`, `../recipes/<id>.tsx`, and `../recipes/<id>.css`. Treat the complete source as an inspectable starting point. The recipe notes define props and adaptation boundaries.

## Choose an integration route

- **Existing Radix/shadcn component:** Retain the primitive, accessible roles, trigger/content relationships, controlled state, keyboard handling, portals, and focus return. Apply the recipe's state transitions and motion to the appropriate existing elements. Preserve the primitive's mounting lifecycle when coordinating exit animations.
- **Existing custom component:** Keep its public API and application state owner. Transfer the relevant animation and any required CSS; avoid a second state owner or duplicate action handlers.
- **New standalone component:** Copy the selected TSX and CSS together. Confirm imports, client component boundaries, and the documented dependencies. Keep the CSS import connected and adapt tokens and fonts to the host.

Production defaults are `preview={false}` and natural sizing. Keep gallery frames, fixed demonstration bounds, and sample data out of the application flow. Use `speed` according to the recipe's documented timing semantics and `radius` to match the host shape. Inspect the source before changing ranges or defaults.

For **StateButton**, provide the application's real `onAction` and propagate its completion or failure. For **Copy Feedback**, reflect the actual clipboard result. **ToastStack** uses local demonstration state; transfer its arrival, stacking, and dismissal behavior to the existing notification provider, preserving that provider's announcement and lifecycle behavior. Keep demo simulations explicitly labeled wherever retained.

## Optional installer

From the kit directory, replace `/path/to/app` with the existing project directory:

```sh
node install.mjs list --json
node install.mjs add state-button --project /path/to/app --dir components/bera --dry-run --json
node install.mjs add state-button --project /path/to/app --dir components/bera --json
node install.mjs skill --project /path/to/app --agent codex --json
```

`add` copies only the selected TSX/CSS and reports dependencies missing from the project's package manifest; it does not install packages. `skill` copies the full kit into the agent's project skill folder. Supported agents are `codex`, `claude`, `cursor`, and `copilot`; Codex is the default. Both commands support `--dry-run`, keep identical files, and stop on differing files. Resolve conflicts by inspecting the host changes before adapting or choosing another destination.

Run the host's relevant type, lint, and build checks. Verify the actual interaction at desktop and narrow phone widths, and report only checks performed.

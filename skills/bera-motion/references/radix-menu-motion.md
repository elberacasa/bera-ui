# Radix menu motion

Add a short, directional reveal to an existing Radix dropdown menu. The adapter contains one CSS file and adds no package dependencies. Your menu keeps its markup, appearance, state, commands, portals, and keyboard behavior.

[Try the integration](https://bera-ui.vercel.app/integrations/radix-menu) · [Read the CSS](../adapters/radix-menu-motion.css)

## Read the host first

Inspect the local dropdown-menu implementation and its callers. Confirm that it uses Radix: imports may come from `radix-ui` or `@radix-ui/react-dropdown-menu`. The [shadcn Radix dropdown documentation](https://ui.shadcn.com/docs/components/radix/dropdown-menu) is the relevant reference; Base UI menus have a different integration contract.

Identify the existing `Content` and `SubContent` elements, animation classes, controlled state, selection callbacks, and any custom focus or dismissal handlers. Retain those behaviors. A wrapper must forward the data attribute to the Radix content element.

## Install the stylesheet

In a project with shadcn configured:

```sh
npx shadcn@latest add https://bera-ui.vercel.app/r/radix-menu-motion.json
```

This adds `bera/radix-menu-motion.css` under the configured components directory. With the `@bera` namespace already configured, use `npx shadcn@latest add @bera/radix-menu-motion`.

Or, from the portable kit directory:

```sh
node install.mjs add radix-menu-motion --project /path/to/app
```

The local installer defaults to `components/bera/radix-menu-motion.css`. Both routes add a stylesheet; applying it to the existing menu is the next step.

## Apply it to the host

Import the stylesheet after the existing menu styles. Adjust the import to your component alias. Add the presence attribute to each content element that should use the motion:

```diff
+import "@/components/bera/radix-menu-motion.css";

-<DropdownMenuContent align="end">
+<DropdownMenuContent data-bera-menu-motion align="end">
   {items}
 </DropdownMenuContent>

-<DropdownMenuSubContent>
+<DropdownMenuSubContent data-bera-menu-motion>
   {submenuItems}
 </DropdownMenuSubContent>
```

Keep the host's other props and children. Any value of `data-bera-menu-motion` enables the adapter; omit the attribute to disable it. Apply it to `Content` and `SubContent`, leaving the trigger and positioning wrapper unchanged.

Remove competing enter/exit animation utilities only from the opted-in content: for example, its `animate-in`, `animate-out`, `fade-*`, `zoom-*`, and `slide-*` variants. Keep its colors, border, radius, padding, width, focus states, and collision settings. Also inspect custom or inline `animation`, `transition`, `opacity`, `translate`, and `clip-path` declarations for conflicts. Do not disable the host's global animations.

## Tune the motion

Set these custom properties on the opted-in content or through a class that reaches it across the portal:

| Property                     | Default | Value                                  |
| ---------------------------- | ------- | -------------------------------------- |
| `--bera-menu-enter-duration` | `220ms` | Finite, nonnegative CSS time           |
| `--bera-menu-exit-duration`  | `100ms` | Finite, nonnegative CSS time           |
| `--bera-menu-distance`       | `6px`   | CSS length, such as `4px` or `0.25rem` |

```css
.document-menu[data-bera-menu-motion] {
  --bera-menu-enter-duration: 180ms;
  --bera-menu-exit-duration: 90ms;
  --bera-menu-distance: 4px;
}
```

The adapter reads Radix's resolved `data-side`, including collision changes. It combines opacity, translation, and clipping without scaling text. Host fonts, colors, corners, and dimensions remain host styles. This adapter does not use the standalone recipes' `speed`, `radius`, or `preview` props.

The settled clipping region extends 32px beyond the content. Review unusually broad shadows or effects that paint outside that margin; adjust the copied stylesheet when the host needs a larger region. The adapter does not change placement. Keep the host's responsive submenu positioning and verify it at narrow widths.

## Lifecycle and browser behavior

Keep Radix's normal conditional mounting. Do not add `forceMount`, a second presence controller, or a timer that closes the menu. A finite CSS animation lets Radix retain the content through the exit, then unmount it. The native modal isolation and focus-return lifecycle remain in effect during that brief exit. This follows [Radix's CSS animation lifecycle](https://www.radix-ui.com/primitives/docs/guides/animation).

Entry uses [`@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style), supported by current browsers. Browsers that do not support it show the menu immediately on entry; the finite exit still runs. With reduced motion enabled, visual transitions are removed and the native presence animation completes at zero duration. Keep that animation name intact: removing it during an active exit can interrupt Radix's cleanup. Keep normal exit durations short; slowing the exit also prolongs its native modal lifecycle.

## Verify the integration

- Open by pointer, Enter, Space, and ArrowDown. Check focus movement, typeahead, disabled items, and visible focus in both normal and reduced motion.
- Activate real commands once. Check checkbox state, submenu radio selection, clipboard outcomes, and any application effects without replacing the host's callbacks.
- Open and close submenus with the keyboard and pointer. Verify direction and bounds when Radix places a submenu on the opposite side.
- Dismiss with Escape, outside interaction, and item selection. After exit, content is unmounted, focus returns as the host intends, and page interaction and scrolling are restored.
- Reverse open/close rapidly, including during exit. No stale exit should remove a reopened menu or leave a transparent interactive layer.
- Inspect the main menu and submenu at a 320px viewport and near screen edges. Check clipping, shadows, long labels, and menu scrolling independently of page overflow.

Run the host's relevant checks. Report the browsers and interactions actually verified. See [integration guidance](integration.md) for the wider host contract.

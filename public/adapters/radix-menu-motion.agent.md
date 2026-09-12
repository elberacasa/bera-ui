# Radix menu motion

Add a short, directional reveal to an existing Radix dropdown menu. The adapter contains one CSS file and adds no package dependencies. Your menu keeps its markup, appearance, state, commands, portals, and keyboard behavior.

[Try the integration](https://bera-ui.vercel.app/integrations/radix-menu) · [Read the CSS](https://bera-ui.vercel.app/adapters/radix-menu-motion.css)

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

Run the host's relevant checks. Report the browsers and interactions actually verified. See [integration guidance](https://bera-ui.vercel.app/transitions/integration.md) for the wider host contract.


## Complete stylesheet

```css
/*
MIT License

Copyright (c) 2026 Alejandro Beracasa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* Add data-bera-menu-motion to your existing Radix Content or SubContent.
 * Keep its Root, Portal, items, state, callbacks, and appearance unchanged.
 * Import this after your menu styles; remove its old enter/exit animation classes.
 */
[data-bera-menu-motion][data-state] {
  --bera-menu-shift-x: 0px;
  --bera-menu-shift-y: calc(-1 * var(--bera-menu-distance, 6px));
  --bera-menu-closed-clip: inset(0 0 70% 0);

  opacity: 1;
  translate: 0 0;
  clip-path: inset(-32px);
  animation: none;
  transition-property: opacity, translate, clip-path;
  transition-duration: var(--bera-menu-enter-duration, 220ms);
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Radix updates data-side when collision handling changes the placement. */
[data-bera-menu-motion][data-side="top"] {
  --bera-menu-shift-y: var(--bera-menu-distance, 6px);
  --bera-menu-closed-clip: inset(70% 0 0 0);
}

[data-bera-menu-motion][data-side="left"] {
  --bera-menu-shift-x: var(--bera-menu-distance, 6px);
  --bera-menu-shift-y: 0px;
  --bera-menu-closed-clip: inset(0 0 0 70%);
}

[data-bera-menu-motion][data-side="right"] {
  --bera-menu-shift-x: calc(-1 * var(--bera-menu-distance, 6px));
  --bera-menu-shift-y: 0px;
  --bera-menu-closed-clip: inset(0 70% 0 0);
}

[data-bera-menu-motion][data-state="closed"] {
  opacity: 0;
  translate: var(--bera-menu-shift-x) var(--bera-menu-shift-y);
  clip-path: var(--bera-menu-closed-clip);
  transition-duration: var(--bera-menu-exit-duration, 100ms);
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
  animation: bera-menu-presence var(--bera-menu-exit-duration, 100ms) linear 1
    both;
  /* Radix can supply inline pointer-events inside another modal layer. */
  pointer-events: none !important;
}

@starting-style {
  [data-bera-menu-motion][data-state="open"] {
    opacity: 0;
    translate: var(--bera-menu-shift-x) var(--bera-menu-shift-y);
    clip-path: var(--bera-menu-closed-clip);
  }
}

/* Radix Presence waits for CSS animationend, not transitionend. This finite
 * clock retains its native exit lifecycle while transitions can reverse from
 * their current values. It does not animate any visual or layout property.
 */
@keyframes bera-menu-presence {
  from {
    --bera-menu-presence: 0;
  }
  to {
    --bera-menu-presence: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-bera-menu-motion][data-state] {
    /* Preserve the clock's name if this preference changes during an exit.
     * Canceling it with animation:none would strand Radix's suspended Presence.
     * A zero-duration clock completes immediately without any visual motion.
     */
    animation-duration: 0s;
    transition: none;
    translate: none;
    clip-path: none;
  }
}

```

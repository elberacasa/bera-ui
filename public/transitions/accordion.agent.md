# Accordion

More detail. The same quiet rhythm.

## Choose this for

Expandable help, preferences, and short supporting details.

## Integration

Supply items and connect value/onValueChange if controlled. Keep the heading/panel relationship and make closed interactive content inert.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `Accordion`

Props: items, value, defaultValue, onValueChange, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/accordion.tsx`
Styles: `../recipes/accordion.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `accordion.tsx`:

```tsx
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
"use client";
import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import "./accordion.css";
interface SurfaceMotionProps {
    preview?: boolean;
    radius?: number;
    className?: string;
    style?: CSSProperties;
    /** Playback rate: 1 is normal; .35 is slow motion. */
    speed?: number;
    /** Change this value to exercise the next transition. */
    replayKey?: number;
}
function useSurfaceMotion(speed: number) {
    const reduced = useReducedMotion();
    const rate = Number.isFinite(speed) ? Math.max(0.15, speed) : 1;
    return {
        reduced,
        rate,
        spring: reduced
            ? { duration: 0 }
            : {
                type: "spring" as const,
                stiffness: 470 * rate * rate,
                damping: 34 * rate,
                mass: 0.9,
            },
        fade: (duration = 0.14, delay = 0) => ({
            duration: reduced ? 0 : duration / rate,
            delay: reduced ? 0 : delay / rate,
            ease: "easeOut" as const,
        }),
    };
}
const accordionItems = [
    {
        title: "Can I use this in my project?",
        body: "Yes. Copy the component and its styles, then make it your own.",
    },
    {
        title: "Does it work with a keyboard?",
        body: "Tab to a heading. Press Enter or Space to open and close it.",
    },
    {
        title: "Can I change the motion?",
        body: "Set the speed to suit your interface. Reduced motion is respected automatically.",
    },
];
interface AccordionItem {
    title: string;
    body: ReactNode;
}
interface AccordionProps extends SurfaceMotionProps {
    items?: readonly AccordionItem[];
    /** The open item index, or null for all closed. */
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
}
/** Intrinsic content height keeps text unscaled, including during reversals. */
function Accordion({ speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, items = accordionItems, value, defaultValue = 0, onValueChange, }: AccordionProps) {
    const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
    const expanded = value === undefined ? internalValue : value;
    const [previousReplay, setPreviousReplay] = useState(replayKey);
    const id = useId();
    const { reduced, spring, fade } = useSurfaceMotion(speed);
    // Gallery replay only adjusts local state. Controlled values belong to the caller.
    if (previousReplay !== replayKey) {
        setPreviousReplay(replayKey);
        if (value === undefined) {
            setInternalValue(items.length === 0
                ? null
                : internalValue === null
                    ? 0
                    : (internalValue + 1) % items.length);
        }
    }
    return (<div data-preview={preview} className={`bt-surface-demo bt-accordion-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bt-accordion">
        {items.map((item, index) => {
            const isOpen = expanded === index;
            const triggerId = `${id}-trigger-${index}`;
            const panelId = `${id}-panel-${index}`;
            return (<div className="bt-accordion-item" key={item.title} data-open={isOpen}>
              <h3 className="bt-accordion-heading">
                <button id={triggerId} type="button" className="bt-accordion-trigger" aria-expanded={isOpen} aria-controls={panelId} onClick={() => {
                    const next = expanded === index ? null : index;
                    if (value === undefined)
                        setInternalValue(next);
                    onValueChange?.(next);
                }}>
                  <span>{item.title}</span>
                  <motion.span className="bt-disclosure" initial={false} animate={{ rotate: isOpen ? 180 : 0 }} transition={spring}>
                    <ChevronDown size={15} aria-hidden="true"/>
                  </motion.span>
                </button>
              </h3>
              <motion.div id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!isOpen} inert={!isOpen} className="bt-accordion-panel" initial={false} animate={{ height: isOpen ? "auto" : 0 }} transition={spring}>
                <motion.div className="bt-accordion-body" initial={false} animate={{
                    opacity: isOpen ? 1 : 0,
                    y: reduced ? 0 : isOpen ? 0 : -5,
                }} transition={{
                    ...spring,
                    opacity: fade(isOpen ? 0.18 : 0.1, isOpen ? 0.045 : 0),
                }}>
                  {item.body}
                </motion.div>
              </motion.div>
            </div>);
        })}
      </div>
    </div>);
}
export { Accordion };

```

Save as `accordion.css`:

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
.bt-surface-demo {
  --bt-foreground: var(--foreground, #eee);
  --bt-muted: var(--muted-foreground, #888);
  --bt-popover: var(--popover, #191919);
  --bt-border: var(--border, #333);
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 230px;
  min-width: 0;
  color: var(--bt-foreground);
  font-family: inherit;
  isolation: isolate;
}

.bt-surface-demo *,
.bt-surface-demo *::before,
.bt-surface-demo *::after {
  box-sizing: border-box;
}
.bt-surface-demo button {
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.bt-surface-demo button:focus-visible {
  outline: 2px solid var(--bt-foreground);
  outline-offset: 3px;
}
.bt-surface-demo button {
  cursor: pointer;
}

.bt-morph-preview {
  max-width: 320px;
  margin-inline: auto;
}
.bt-morph-preview[data-preview="true"] {
  container-type: inline-size;
}
.bt-morph-preview[data-preview="true"] .bt-morph-surface {
  max-width: calc(100% - 24px);
}
.bt-morph-preview[data-preview="true"] .bt-morph-content {
  width: min(236px, calc(100cqw - 26px));
}
.bt-morph-surface {
  position: absolute;
  right: 12px;
  bottom: 23px;
  overflow: hidden;
  background: var(--bt-popover);
  border: 1px solid var(--bt-border);
  box-shadow:
    0 9px 28px #0005,
    0 1px 2px #0004,
    inset 0 1px #ffffff05;
}
.bt-morph-surface:has(.bt-morph-trigger:focus-visible) {
  outline: 2px solid var(--bt-foreground);
  outline-offset: 4px;
}
.bt-morph-trigger {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 120px;
  height: 42px;
  padding: 0;
  border: 0;
  color: var(--bt-foreground);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
}
.bt-morph-trigger > span {
  max-width: 78px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bt-morph-trigger:disabled {
  cursor: default;
  opacity: 0.5 !important;
}
.bt-morph-trigger:hover {
  background: #ffffff05;
}
.bt-morph-trigger:focus-visible {
  outline: none !important;
}
.bt-morph-content {
  position: absolute;
  inset: 0 auto auto 0;
  width: 236px;
  padding: 5px;
}
.bt-menu-heading {
  display: flex;
  height: 41px;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  color: var(--bt-muted);
  font-size: 11px;
  font-weight: 500;
}
.bt-menu-heading > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bt-menu-close {
  display: grid;
  width: 44px;
  height: 41px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 7px;
  color: var(--bt-muted);
  background: transparent;
}
.bt-menu-close:hover {
  color: var(--bt-foreground);
  background: #ffffff07;
}
.bt-menu-items {
  display: grid;
  gap: 1px;
  max-height: 134px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.bt-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  width: 100%;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--bt-foreground);
  text-align: left;
  font-size: 12px;
  line-height: 1;
}
.bt-menu-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  flex-shrink: 0;
  color: var(--bt-muted);
}
.bt-menu-action-icon > svg {
  width: 15px;
  height: 15px;
}
.bt-menu-item:hover,
.bt-menu-item:focus-visible {
  background: color-mix(in srgb, var(--bt-foreground) 8%, var(--bt-popover));
  color: var(--bt-foreground);
  outline: none !important;
}
.bt-menu-item:focus-visible {
  box-shadow: inset 0 0 0 1px #444;
}
.bt-menu-checked {
  margin-left: auto;
}
.bt-pin-indicator {
  position: absolute;
  left: 26px;
  top: 2px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--bt-muted);
  font-size: 10px;
}
.bt-demo-feedback {
  position: absolute;
  bottom: 3px;
  left: 0;
  width: 100%;
  min-height: 13px;
  padding-inline: 12px;
  text-align: center;
  color: var(--bt-muted);
  font-size: 10px;
}

.bt-accordion {
  width: min(282px, calc(100% - 30px));
  overflow: hidden;
  border: 1px solid var(--bt-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bt-popover);
  box-shadow: 0 5px 20px #0003;
}
.bt-accordion-item + .bt-accordion-item {
  border-top: 1px solid var(--bt-border);
}
.bt-accordion-heading {
  margin: 0;
  font: inherit;
}
.bt-accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 45px;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--bt-foreground);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.bt-accordion-trigger:hover,
.bt-accordion-item[data-open="true"] .bt-accordion-trigger {
  color: var(--bt-foreground);
}
.bt-accordion-trigger:focus-visible {
  position: relative;
  outline-offset: -4px;
  border-radius: 8px;
}
.bt-disclosure {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--bt-muted);
}
.bt-accordion-panel {
  overflow: hidden;
}
.bt-accordion-body {
  padding: 0 32px 14px 14px;
  color: var(--bt-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.65;
}

.bt-toast-position {
  position: absolute;
  left: 50%;
  top: 68px;
  width: min(268px, calc(100% - 36px));
  height: 76px;
  transform: translateX(-50%);
}
.bt-toast-list {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bt-toast {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  min-height: 76px;
  padding: 14px 43px 14px 14px;
  border: 1px solid var(--bt-border);
  border-radius: var(--bera-radius, 11px);
  background: var(--bt-popover);
  box-shadow:
    0 8px 16px #0004,
    inset 0 1px #ffffff05;
}
.bt-toast-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 29px;
  height: 29px;
  border: 1px solid var(--bt-border);
  border-radius: 50%;
  color: var(--bt-foreground);
  background: color-mix(in srgb, var(--bt-foreground) 4%, var(--bt-popover));
}
.bt-toast-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}
.bt-toast-title {
  color: var(--bt-foreground);
  font-size: 12px;
  line-height: 1.4;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bt-toast-number {
  margin-left: 2px;
  color: var(--bt-muted);
  font-variant-numeric: tabular-nums;
  font-size: 10px;
}
.bt-toast-description {
  color: var(--bt-muted);
  font-size: 11px;
  line-height: 1.5;
}
.bt-toast-dismiss {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--bera-radius, 10px);
  color: var(--bt-muted);
  background: transparent;
}
.bt-toast-dismiss:hover {
  background: #ffffff07;
  color: var(--bt-foreground);
}
.bt-toast-dismiss:focus-visible {
  outline-offset: -4px;
}
.bt-toast-empty {
  display: flex;
  width: 100%;
  height: 76px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--bt-muted);
  font-size: 12px;
}
.bt-toast-add {
  position: absolute;
  bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid var(--bt-border);
  border-radius: 8px;
  background: var(--bt-popover);
  color: var(--bt-foreground);
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 1px 2px #0003;
}
.bt-toast-add:hover {
  color: var(--bt-foreground);
  background: color-mix(in srgb, var(--bt-foreground) 4%, var(--bt-popover));
  border-color: color-mix(in srgb, var(--bt-foreground) 20%, var(--bt-border));
}
.bt-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bt-surface-demo *,
  .bt-surface-demo *::before,
  .bt-surface-demo *::after {
    scroll-behavior: auto;
  }
}

/* Gallery framing does not travel into the host application. */
.bt-surface-demo[data-preview="false"] {
  height: auto;
  max-width: 100%;
  width: fit-content;
}
.bt-morph-preview[data-preview="false"] .bt-morph-surface {
  position: relative;
  right: auto;
  bottom: auto;
}
.bt-surface-demo[data-preview="false"] .bt-demo-feedback,
.bt-surface-demo[data-preview="false"] .bt-pin-indicator {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.bt-accordion-preview[data-preview="false"] {
  width: 282px;
}
.bt-accordion-preview[data-preview="false"] .bt-accordion {
  width: 100%;
}
.bt-toast-preview[data-preview="false"] {
  width: 268px;
  height: 120px;
}
.bt-toast-preview[data-preview="false"] .bt-toast-position {
  top: 24px;
  width: 100%;
}
.bt-toast-preview[data-preview="false"] .bt-toast-add {
  display: none;
}

```

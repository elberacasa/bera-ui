# Toast stack

Feedback with a little sense of space.

## Choose this for

A notification system with multiple recent messages.

## Integration

Adapt the stack geometry to the existing toast provider. This reference uses a local Preview toast control; preserve the host provider's lifecycle, expiry, pause, live region, and dismissal semantics.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `ToastStack`

Props: title, description, replayKey, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [toast-stack.tsx](https://bera-ui.vercel.app/transitions/toast-stack.tsx)
Styles: [toast-stack.css](https://bera-ui.vercel.app/transitions/toast-stack.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `toast-stack.tsx`:

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
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, Plus, X } from "lucide-react";
import "./toast-stack.css";
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
type PreviewToast = {
    id: number;
    title: string;
    description: ReactNode;
};
interface ToastStackProps extends SurfaceMotionProps {
    /** New notifications capture these values when added, preserving older content. */
    title?: string;
    description?: ReactNode;
}
/** Local preview notifications. The newest is on top; dismiss reveals the next. */
function ToastStack({ speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, title = "Preview notification", description = "Created locally in this demo.", }: ToastStackProps) {
    const [toasts, setToasts] = useState<PreviewToast[]>(() => [
        { id: 1, title, description },
    ]);
    const [announcement, setAnnouncement] = useState("");
    const counter = useRef(1);
    const previousReplay = useRef(replayKey);
    const previewButton = useRef<HTMLButtonElement>(null);
    const dismissButtons = useRef(new Map<number, HTMLButtonElement>());
    const focusFrame = useRef<number | null>(null);
    const { reduced, spring, fade } = useSurfaceMotion(speed);
    function addToast() {
        const id = ++counter.current;
        setToasts((current) => [{ id, title, description }, ...current].slice(0, 3));
        setAnnouncement(`Notification ${id}: ${title}.`);
    }
    function dismissToast(id: number) {
        const wasFocused = document.activeElement === dismissButtons.current.get(id);
        const remaining = toasts.filter((toast) => toast.id !== id);
        setToasts(remaining);
        setAnnouncement(remaining.length
            ? `Notification dismissed. ${remaining.length} remaining.`
            : "All preview notifications dismissed.");
        if (wasFocused) {
            if (focusFrame.current !== null)
                cancelAnimationFrame(focusFrame.current);
            focusFrame.current = requestAnimationFrame(() => {
                const nextButton = remaining[0]
                    ? dismissButtons.current.get(remaining[0].id)
                    : null;
                (nextButton ?? previewButton.current)?.focus({ preventScroll: true });
            });
        }
    }
    useEffect(() => {
        if (previousReplay.current === replayKey)
            return;
        previousReplay.current = replayKey;
        const id = ++counter.current;
        setToasts((current) => [{ id, title, description }, ...current].slice(0, 3));
        setAnnouncement(`Notification ${id}: ${title}.`);
    }, [replayKey, title, description]);
    useEffect(() => () => {
        if (focusFrame.current !== null)
            cancelAnimationFrame(focusFrame.current);
    }, []);
    return (<div data-preview={preview} className={`bt-surface-demo bt-toast-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bt-toast-position">
        <AnimatePresence initial={false}>
          {!toasts.length ? (<motion.div key="empty" className="bt-toast-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade()}>
              <Bell size={19} aria-hidden="true"/>
              <span>No notifications</span>
            </motion.div>) : null}
        </AnimatePresence>
        <ol className="bt-toast-list" aria-label="Preview notifications">
          <AnimatePresence initial={false}>
            {toasts.map((toast, index) => (<motion.li key={toast.id} className="bt-toast" aria-hidden={index > 0} inert={index > 0} initial={{
                opacity: 0,
                y: reduced ? 0 : 25,
                scale: reduced ? 1 : 0.98,
            }} animate={{
                opacity: 1 - index * 0.17,
                y: index * -11,
                scale: 1 - index * 0.045,
                x: 0,
            }} exit={{
                opacity: 0,
                x: reduced ? 0 : 38,
                transition: fade(0.15),
            }} transition={{ ...spring, opacity: fade(0.16) }} style={{
                zIndex: 3 - index,
                pointerEvents: index === 0 ? "auto" : "none",
                transformOrigin: "50% 0%",
            }}>
                <span className="bt-toast-icon">
                  <Bell size={15} aria-hidden="true"/>
                </span>
                <div className="bt-toast-copy">
                  <span className="bt-toast-title">
                    {toast.title}{" "}
                    {toast.title === "Preview notification" ? (<span className="bt-toast-number">{toast.id}</span>) : null}
                  </span>
                  <span className="bt-toast-description">
                    {toast.description}
                  </span>
                </div>
                <button ref={(element) => {
                if (element)
                    dismissButtons.current.set(toast.id, element);
                else
                    dismissButtons.current.delete(toast.id);
            }} type="button" className="bt-toast-dismiss" aria-label={`Dismiss ${toast.title} ${toast.id}`} tabIndex={index === 0 ? 0 : -1} onClick={() => dismissToast(toast.id)}>
                  <X size={14} aria-hidden="true"/>
                </button>
              </motion.li>))}
          </AnimatePresence>
        </ol>
      </div>
      <motion.button ref={previewButton} type="button" className="bt-toast-add" whileTap={reduced ? undefined : { y: 1, scale: 0.98 }} transition={spring} onClick={addToast}>
        <Plus size={15} aria-hidden="true"/>
        Preview toast
      </motion.button>
      <span className="bt-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>);
}
export { ToastStack };

```

Save as `toast-stack.css`:

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

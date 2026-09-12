# Icon morph

The same strokes. A different intention.

## Choose this for

A menu or panel toggle that needs a clear change of state.

## Integration

Connect pressed/onPressedChange to the actual panel state. Keep the stable label and existing focus management. Forward aria-controls to the panel and preserve host dismissal behavior. Replay changes only the icon, never the application state.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `MorphingIconButton`

Props: pressed, defaultPressed, onPressedChange, label, labels, disabled, buttonRef, native button attributes, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [morphing-icon-button.tsx](https://bera-ui.vercel.app/transitions/morphing-icon-button.tsx)
Styles: [morphing-icon-button.css](https://bera-ui.vercel.app/transitions/morphing-icon-button.css)
Dependencies: React, motion. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `morphing-icon-button.tsx`:

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
import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, Ref } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import "./morphing-icon-button.css";
interface MorphingIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type" | "aria-label" | "aria-pressed"> {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    /** Stable accessible name for the toggle, for example "Navigation menu". */
    label?: string;
    /** State captions and fallback tooltips. The accessible toggle name stays stable. */
    labels?: {
        unpressed: string;
        pressed: string;
    };
    /** Ref to the actual button, for the host's existing focus management. */
    buttonRef?: Ref<HTMLButtonElement>;
    preview?: boolean;
    /** Playback rate: 1 is normal; .35 is slow motion. */
    speed?: number;
    radius?: number;
    /** Replays only the icon; never changes pressed state or invokes a callback. */
    replayKey?: number;
}
// Each path keeps one M and one C command in every pose. The original strokes
// shorten, gather, and become the cross; no icon is replaced or remounted.
const TOP_STROKE = [
    "M5 7C9.67 7 14.33 7 19 7",
    "M5.5 9C9.83 8.7 14.17 10.7 18.5 11",
    "M7 7C10.33 10.33 13.67 13.67 17 17",
];
const MIDDLE_STROKE = [
    "M5 12C9.67 12 14.33 12 19 12",
    "M9 12C11 12 13 12 15 12",
    "M12 12C12 12 12 12 12 12",
];
const BOTTOM_STROKE = [
    "M5 17C9.67 17 14.33 17 19 17",
    "M5.5 15C9.83 15.3 14.17 13.3 18.5 13",
    "M7 17C10.33 13.67 13.67 10.33 17 7",
];
const DEFAULT_LABELS = { unpressed: "Menu", pressed: "Close" };
/**
 * A native toggle button whose three SVG strokes become a close icon.
 * The host owns any associated panel, menu semantics, and dismissal behavior.
 */
function MorphingIconButton({ pressed, defaultPressed = false, onPressedChange, label = "Navigation menu", labels = DEFAULT_LABELS, buttonRef, preview = false, speed = 1, radius = 12, replayKey = 0, disabled = false, className = "", style, title, onClick, ...buttonProps }: MorphingIconButtonProps) {
    const [localPressed, setLocalPressed] = useState(defaultPressed);
    const localValue = useRef(defaultPressed);
    const active = pressed ?? localPressed;
    const reduced = Boolean(useReducedMotion());
    const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
    const progress = useMotionValue(active ? 1 : 0);
    const previousReplay = useRef(replayKey);
    const top = useTransform(progress, [0, 0.28, 1], TOP_STROKE);
    const middle = useTransform(progress, [0, 0.2, 0.42], MIDDLE_STROKE);
    const bottom = useTransform(progress, [0, 0.28, 1], BOTTOM_STROKE);
    const middleOpacity = useTransform(progress, [0, 0.18, 0.36], [1, 0.8, 0]);
    useEffect(() => {
        const replay = previousReplay.current !== replayKey;
        previousReplay.current = replayKey;
        const target = active ? 1 : 0;
        if (reduced) {
            progress.set(target);
            return;
        }
        const spring = {
            type: "spring" as const,
            stiffness: 420 * rate * rate,
            damping: 34 * rate,
            mass: 0.9,
            restDelta: 0.001,
            restSpeed: 0.01,
        };
        let cancelled = false;
        // One spring drives every path. Retargeting retains its current geometry
        // and velocity, including when a click interrupts a preview replay.
        let playback = animate(progress, replay && !disabled ? 1 - target : target, spring);
        if (replay && !disabled) {
            void playback.then(() => {
                if (!cancelled)
                    playback = animate(progress, target, spring);
            });
        }
        return () => {
            cancelled = true;
            playback.stop();
        };
    }, [active, disabled, progress, rate, reduced, replayKey]);
    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        onClick?.(event);
        if (event.defaultPrevented || disabled)
            return;
        // Keep consecutive uncontrolled requests correct even before a render.
        const next = !(pressed ?? localValue.current);
        if (pressed === undefined) {
            localValue.current = next;
            setLocalPressed(next);
        }
        onPressedChange?.(next);
    }
    const stateLabel = active ? labels.pressed : labels.unpressed;
    const button = (<button {...buttonProps} ref={buttonRef} type="button" className={`bi-morph-button ${className}`} style={{
            "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
            ...style,
        } as CSSProperties} aria-label={label} aria-pressed={active} disabled={disabled} title={title ?? stateLabel} onClick={handleClick}>
      <svg className="bi-morph-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
        <motion.path data-stroke="top" d={top}/>
        <motion.path data-stroke="middle" d={middle} opacity={middleOpacity}/>
        <motion.path data-stroke="bottom" d={bottom}/>
      </svg>
    </button>);
    if (!preview)
        return button;
    return (<div className="bi-morph-preview" data-preview="true">
      {button}
      <div className="bi-morph-caption" aria-hidden="true">
        <span>{stateLabel}</span>
        <span>Icon preview</span>
      </div>
    </div>);
}
export { MorphingIconButton };

```

Save as `morphing-icon-button.css`:

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
.bi-morph-button {
  --bi-foreground: var(--foreground, #eeeeee);
  --bi-surface: var(--background, #111111);
  --bi-hover: var(--accent, #222222);
  --bi-border: var(--border, #303030);
  position: relative;
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--bera-icon-button-size, 48px);
  height: var(--bera-icon-button-size, 48px);
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  box-sizing: border-box;
  border: 1px solid var(--bi-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bi-surface);
  color: var(--bi-foreground);
  font: inherit;
  vertical-align: middle;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 140ms ease,
    border-color 140ms ease;
}

.bi-morph-button[aria-pressed="true"] {
  background: var(--bi-hover);
}

.bi-morph-button:active:not(:disabled) {
  background: color-mix(in srgb, var(--bi-foreground) 12%, var(--bi-surface));
}

@media (hover: hover) {
  .bi-morph-button:hover:not(:disabled) {
    background: var(--bi-hover);
    border-color: color-mix(
      in srgb,
      var(--bi-foreground) 25%,
      var(--bi-border)
    );
  }
}

.bi-morph-button:focus-visible {
  outline: 2px solid var(--ring, var(--bi-foreground));
  outline-offset: 4px;
}

.bi-morph-button:disabled {
  opacity: 0.42;
  cursor: default;
}

.bi-morph-icon {
  display: block;
  width: var(--bera-icon-size, 24px);
  height: var(--bera-icon-size, 24px);
  flex: none;
  overflow: visible;
  pointer-events: none;
}

.bi-morph-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  width: 100%;
  max-width: 320px;
  min-height: 230px;
  margin-inline: auto;
  color: var(--foreground, #eeeeee);
  font-family: inherit;
}

.bi-morph-caption {
  display: grid;
  gap: 5px;
  text-align: center;
  font-size: 12px;
  line-height: 1.4;
}

.bi-morph-caption > :last-child {
  color: var(--muted-foreground, #888888);
  font-size: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .bi-morph-button {
    transition: none;
  }
}

@media (forced-colors: active) {
  .bi-morph-button[aria-pressed="true"] {
    border-style: double;
    border-width: 3px;
  }

  .bi-morph-button:disabled {
    color: GrayText;
    opacity: 1;
  }
}

```

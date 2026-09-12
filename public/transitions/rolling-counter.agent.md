# Rolling counter

Numbers with direction, not distraction.

## Choose this for

Adjustable integer quantities, totals, or compact counters.

## Integration

Connect value/onValueChange and the allowed range. The reference supports 0–999; adapt digit count explicitly for larger ranges or signed values.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `RollingCounter`

Props: value, defaultValue, onValueChange, min, max, label, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/rolling-counter.tsx`
Styles: `../recipes/rolling-counter.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `rolling-counter.tsx`:

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
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import "./rolling-counter.css";
type PlaybackProps = {
    preview?: boolean;
    radius?: number;
    className?: string;
    style?: CSSProperties;
    /** 1 is normal speed; 0.35 is slow motion. */
    speed?: number;
    /** Replays the interaction without changing or emitting a controlled value. */
    replayKey?: number;
};
function useTiming(speed: number) {
    const reduced = useReducedMotion();
    const rate = Math.max(0.1, speed);
    return useMemo(() => ({
        reduced,
        rate,
        settle: {
            type: "spring" as const,
            bounce: 0.14,
            duration: reduced ? 0 : 0.4 / rate,
        },
        fade: { duration: reduced ? 0 : 0.16 / rate },
        entrance: {
            duration: reduced ? 0 : 0.36 / rate,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    }), [reduced, rate]);
}
type RollingCounterProps = PlaybackProps & {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
};
const clampCount = (count: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(count) ? count : min)));
/** Each decimal place animates independently. Rapid clicks continue from the current position. */
function RollingDigit({ digit, direction, timing, replayKey, }: {
    digit: number;
    direction: 1 | -1;
    timing: ReturnType<typeof useTiming>;
    replayKey: number;
}) {
    // Preserve the logical target across interruptions, then shift by whole runs
    // of ten. Rebasing preserves the visible fraction and never clamps to a wrong digit.
    const position = useMotionValue(-(20 + digit) * 58);
    const target = useRef(20 + digit);
    const previousDigit = useRef(digit);
    const previousReplay = useRef(replayKey);
    const { reduced, rate } = timing;
    useEffect(() => {
        const replay = previousReplay.current !== replayKey;
        const change = direction > 0
            ? (digit - previousDigit.current + 10) % 10
            : -((previousDigit.current - digit + 10) % 10);
        previousDigit.current = digit;
        previousReplay.current = replayKey;
        if (reduced) {
            position.set(-(20 + digit) * 58);
            target.current = 20 + digit;
            return;
        }
        let velocity = position.getVelocity();
        if (replay) {
            position.set(-(19 + digit) * 58);
            target.current = 20 + digit;
            velocity = 0;
        }
        else
            target.current += change;
        const current = -position.get() / 58;
        const distance = target.current - current;
        // If input outruns the spring, skip complete revolutions rather than queue them.
        if (distance > 10)
            target.current -= (Math.ceil(distance / 10) - 1) * 10;
        else if (distance < -10)
            target.current += (Math.ceil(-distance / 10) - 1) * 10;
        const shift = Math.floor(current / 10) * 10 - 20;
        target.current -= shift;
        position.set(-(current - shift) * 58);
        const animation = animate(position, -target.current * 58, {
            type: "spring",
            bounce: 0.1,
            duration: 0.38 / rate,
            velocity,
            onComplete: () => {
                position.set(-(20 + digit) * 58);
                target.current = 20 + digit;
            },
        });
        return () => animation.stop();
    }, [digit, direction, replayKey, reduced, rate, position]);
    return (<span className="bs-digit-window">
      <motion.span className="bs-digit-strip" style={{ y: position }}>
        {Array.from({ length: 50 }, (_, number) => (<span className="bs-digit" key={number}>
            {number % 10}
          </span>))}
      </motion.span>
    </span>);
}
function RollingCounter({ value, defaultValue = 24, onValueChange, min = 0, max = 999, label = "Quantity", speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, }: RollingCounterProps) {
    const low = clampCount(min, 0, 999);
    const high = Math.max(low, clampCount(max, 0, 999));
    const [localValue, setLocalValue] = useState(() => clampCount(defaultValue, low, high));
    const count = clampCount(value ?? localValue, low, high);
    const [movement, setMovement] = useState<{
        count: number;
        direction: 1 | -1;
    }>({ count, direction: 1 });
    // Derive direction from the whole count, including externally controlled jumps.
    const direction = count === movement.count
        ? movement.direction
        : count > movement.count
            ? 1
            : -1;
    if (count !== movement.count)
        setMovement({ count, direction });
    const countRef = useRef(count);
    useEffect(() => {
        countRef.current = count;
    }, [count]);
    const timing = useTiming(speed);
    const id = useId();
    const digits = String(count).padStart(3, "0").split("").map(Number);
    const update = (delta: number) => {
        const next = clampCount(countRef.current + delta, low, high);
        if (next === countRef.current)
            return;
        // Keep repeated events correct even before React commits the next frame.
        if (value === undefined) {
            countRef.current = next;
            setLocalValue(next);
        }
        onValueChange?.(next);
    };
    return (<div data-preview={preview} className={`bs-demo bs-counter-demo ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bs-counter-label" id={`${id}-label`}>
        {label}
      </div>
      <div className="bs-counter-control" role="group" aria-labelledby={`${id}-label`}>
        <motion.button type="button" className="bs-counter-button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={count <= low} onClick={() => update(-1)} whileTap={timing.reduced ? undefined : { scale: 0.89 }} transition={timing.settle}>
          <Minus size={17} strokeWidth={1.8}/>
        </motion.button>
        <div className="bs-counter-value">
          <output className="bs-sr-only" aria-live="polite" aria-atomic="true">
            {count}
          </output>
          <div className="bs-counter-digits" aria-hidden="true">
            {digits.map((digit, index) => (<span className={index < 2 && count < 10 ** (2 - index)
                ? "bs-digit-place bs-digit-muted"
                : "bs-digit-place"} key={index}>
                <RollingDigit digit={digit} direction={direction} timing={timing} replayKey={replayKey}/>
              </span>))}
          </div>
        </div>
        <motion.button type="button" className="bs-counter-button" aria-label={`Increase ${label.toLowerCase()}`} disabled={count >= high} onClick={() => update(1)} whileTap={timing.reduced ? undefined : { scale: 0.89 }} transition={timing.settle}>
          <Plus size={17} strokeWidth={1.8}/>
        </motion.button>
      </div>
      <span className="bs-counter-hint">Every little increment.</span>
    </div>);
}
export { RollingCounter };

```

Save as `rolling-counter.css`:

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
.bs-demo {
  --bs-text: var(--foreground, #ececec);
  --bs-muted: var(--muted-foreground, #888);
  --bs-surface: var(--popover, #1a1a1a);
  --bs-border: var(--border, #333);
  box-sizing: border-box;
  width: 100%;
  min-height: 230px;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bs-text);
  font-family: inherit;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

.bs-demo *,
.bs-demo *::before,
.bs-demo *::after {
  box-sizing: border-box;
}
.bs-demo button,
.bs-demo input {
  font: inherit;
}
.bs-demo button {
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.bs-demo button:disabled {
  cursor: default;
}
.bs-demo button:focus-visible,
.bs-tab-panel:focus-visible {
  outline: 2px solid var(--bs-text);
  outline-offset: 4px;
}
.bs-sr-only {
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

.bs-tabs-body {
  width: 280px;
  max-width: 100%;
}
.bs-tablist {
  display: flex;
  gap: 3px;
  width: 100%;
  padding: 4px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bera-radius, 13px);
  background: var(--background, #111);
}
.bs-tab {
  position: relative;
  isolation: isolate;
  flex: 1 1 0;
  min-width: 0;
  min-height: 36px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--bera-radius, 9px);
  background: transparent;
  color: var(--bs-muted);
  font-size: 12px !important;
  line-height: 1;
  white-space: nowrap;
  transition: color 150ms;
}
.bs-tab:hover {
  color: var(--bs-text);
}
.bs-tab[aria-selected="true"] {
  color: var(--bs-text);
}
.bs-tab-pill {
  position: absolute;
  z-index: -1;
  inset: 0;
  border: 1px solid var(--bs-border);
  border-radius: var(--bera-radius, 9px);
  background: var(--accent, #282828);
  box-shadow:
    0 1px 3px #0004,
    inset 0 1px 0 #ffffff06;
}
.bs-tab-label {
  position: relative;
}
.bs-tab-panel {
  min-height: 116px;
  padding: 15px 3px 0;
  border-radius: 6px;
}
.bs-tab-panel[hidden] {
  display: none;
}
.bs-note-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.bs-note {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 27px;
}
.bs-note-dot {
  flex: 0 0 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #383838;
}
.bs-note-dot-unread {
  background: #d3d3d3;
}
.bs-note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--bs-text);
}
.bs-note-time {
  margin-left: auto;
  font-size: 9px;
  color: var(--bs-muted);
  white-space: nowrap;
}
.bs-note-summary {
  margin-top: 10px;
  padding-left: 12px;
  color: var(--bs-muted);
  font-size: 10px;
}

.bs-search-stage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36px;
}
.bs-search-form {
  position: relative;
  max-width: 100%;
  height: 44px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bs-surface);
  box-shadow:
    0 2px 4px #0002,
    inset 0 1px 0 #ffffff03;
}
.bs-search-form:focus-within {
  box-shadow: 0 0 0 2px #bcbcbc;
}
.bs-search-trigger {
  position: absolute;
  top: 0;
  left: 0;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: var(--bera-radius, 11px);
  background: transparent;
  color: var(--bs-text);
}
.bs-search-trigger:hover {
  color: var(--bs-text);
}
.bs-search-icon {
  position: absolute;
  left: 13px;
  top: 12px;
  display: flex;
}
.bs-search-label {
  position: absolute;
  top: 13px;
  left: 40px;
  line-height: 16px;
  pointer-events: none;
}
.bs-search-input {
  position: absolute;
  top: 0;
  left: 40px;
  width: calc(100% - 80px);
  min-width: 0;
  height: 42px;
  padding: 0;
  outline: 0;
  border: 0;
  background: transparent;
  color: var(--bs-text);
  font-size: 12px !important;
  caret-color: var(--bs-text);
}
.bs-search-input::placeholder {
  color: var(--bs-muted);
}
.bs-search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.bs-search-clear {
  position: absolute;
  top: 3px;
  right: 3px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--bs-muted);
  background: transparent;
  transition:
    color 150ms,
    background 150ms;
}
.bs-search-clear:hover {
  color: var(--bs-text);
  background: #ffffff06;
}
.bs-search-clear-glyph {
  display: grid;
  place-items: center;
}
.bs-search-result-space {
  width: 100%;
  min-height: 45px;
  padding-top: 16px;
  text-align: center;
}
.bs-search-hint {
  color: var(--bs-muted);
  font-size: 10px;
  line-height: 19px;
}
.bs-search-results {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  justify-content: center;
}
.bs-search-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid var(--bs-border);
  border-radius: 5px;
  color: var(--bs-text);
  font-size: 10px;
  line-height: 17px;
}
.bs-search-result svg {
  color: var(--bs-muted);
}

.bs-counter-demo {
  flex-direction: column;
  gap: 14px;
}
.bs-counter-label {
  color: var(--bs-muted);
  font-size: 11px;
  line-height: 16px;
}
.bs-counter-control {
  display: flex;
  align-items: center;
  gap: 18px;
}
.bs-counter-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--bs-border);
  border-radius: 50%;
  color: var(--bs-text);
  background: var(--bs-surface);
  box-shadow: inset 0 1px 0 #ffffff03;
  transition:
    color 150ms,
    border-color 150ms,
    background 150ms,
    opacity 150ms;
}
.bs-counter-button:hover:not(:disabled) {
  color: var(--bs-text);
  background: var(--accent, #232323);
  border-color: var(--bs-border);
}
.bs-counter-button:disabled {
  opacity: 0.3;
}
.bs-counter-value {
  position: relative;
}
.bs-counter-digits {
  display: flex;
  font-size: 48px;
  line-height: 1;
  font-weight: 450;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}
.bs-digit-place {
  width: 30px;
  transition: color 180ms;
}
.bs-digit-muted {
  color: #373737;
}
.bs-digit-window {
  display: block;
  height: 58px;
  overflow: hidden;
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.bs-digit-strip {
  display: flex;
  flex-direction: column;
  height: 2900px;
  will-change: transform;
}
.bs-digit {
  flex: 0 0 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bs-counter-hint {
  margin-top: 0;
  color: var(--bs-muted);
  font-size: 10px;
  line-height: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .bs-demo *,
  .bs-demo *::before,
  .bs-demo *::after {
    transition-duration: 0s !important;
  }
}

@media (pointer: coarse) {
  .bs-search-input {
    font-size: 16px !important;
  }
}

/* Application imports use the natural component size. */
.bs-demo[data-preview="false"] {
  min-height: 0;
  padding: 0;
  max-width: 100%;
  width: fit-content;
}
.bs-demo[data-preview="false"] .bs-search-stage {
  padding-top: 0;
}
.bs-demo[data-preview="false"] .bs-counter-hint {
  display: none;
}

```

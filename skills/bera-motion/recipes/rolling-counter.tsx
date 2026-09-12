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

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
import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCheck, FileCheck2, MessageSquare } from "lucide-react";
import "./text-swap.css";
type FeedbackDemoProps = {
    preview?: boolean;
    speed?: number;
    replayKey?: number;
    radius?: number;
    className?: string;
    style?: CSSProperties;
};
const EASE = [0.22, 1, 0.36, 1] as const;
const normalizeSpeed = (speed: number) => Number.isFinite(speed) && speed > 0 ? Math.max(0.1, speed) : 1;
/** A replay never runs on initial mount or because an unrelated prop changed. */
function useReplay(replayKey: number, replay: () => void) {
    const action = useRef(replay);
    const previous = useRef(replayKey);
    useEffect(() => {
        action.current = replay;
    }, [replay]);
    useEffect(() => {
        if (previous.current === replayKey)
            return;
        previous.current = replayKey;
        action.current();
    }, [replayKey]);
}
const STATUSES = [
    { text: "Changes saved.", Icon: FileCheck2 },
    { text: "Ready for review.", Icon: MessageSquare },
    { text: "You’re all set.", Icon: CheckCheck },
] as const;
type TextSwapStatus = {
    text: string;
    Icon: ComponentType<{
        size?: number;
        strokeWidth?: number;
    }>;
};
type TextSwapProps = FeedbackDemoProps & {
    statuses?: readonly TextSwapStatus[];
    /** Controlled status index for application progress or feedback. */
    value?: number;
};
/** A status sentence changes directionally; the glyphs never stretch. */
function TextSwap({ speed: requestedSpeed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, statuses, value, }: TextSwapProps) {
    const speed = normalizeSpeed(requestedSpeed);
    const reduced = Boolean(useReducedMotion());
    const [step, setStep] = useState(0);
    const next = useCallback(() => setStep((current) => current + 1), []);
    useReplay(replayKey, next);
    const choices = statuses?.length ? statuses : preview ? STATUSES : [];
    const current = value === undefined
        ? step
        : Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    const status = choices[current % choices.length];
    if (!status)
        return null;
    return (<div data-preview={preview} className={`bf-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bf-main">
        <div className="bf-status-line" aria-hidden="true">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={`${current}-${status.text}`} className="bf-status-content" initial="enter" animate="visible" exit="exit" variants={{
            enter: {},
            visible: {
                transition: { staggerChildren: reduced ? 0 : 0.035 / speed },
            },
            exit: {
                transition: {
                    staggerChildren: reduced ? 0 : 0.018 / speed,
                    staggerDirection: -1,
                },
            },
        }}>
              <motion.span className="bf-status-icon" variants={{
            enter: {
                opacity: 0,
                y: reduced ? 0 : 8,
                rotate: reduced ? 0 : -12,
            },
            visible: { opacity: 1, y: 0, rotate: 0 },
            exit: {
                opacity: 0,
                y: reduced ? 0 : -8,
                rotate: reduced ? 0 : 8,
            },
        }} transition={{ duration: reduced ? 0 : 0.3 / speed, ease: EASE }}>
                <status.Icon size={21} strokeWidth={1.6}/>
              </motion.span>
              <span className="bf-status-words">
                {status.text.split(" ").map((word, index) => (<motion.span key={`${word}-${index}`} variants={{
                enter: {
                    opacity: 0,
                    y: reduced ? 0 : 10,
                    filter: reduced ? "blur(0px)" : "blur(5px)",
                },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                exit: {
                    opacity: 0,
                    y: reduced ? 0 : -9,
                    filter: reduced ? "blur(0px)" : "blur(4px)",
                },
            }} transition={{
                duration: reduced ? 0 : 0.3 / speed,
                ease: EASE,
            }}>
                    {word}
                  </motion.span>))}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="bf-sr-only" role="status" aria-atomic="true">
          {status.text}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>Status feedback</span>
        <button type="button" className="bf-small-button" disabled={value !== undefined} onClick={next}>
          Next state
          <ArrowRight size={13} aria-hidden="true"/>
        </button>
      </div>
    </div>);
}
export { TextSwap };

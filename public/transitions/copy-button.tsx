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
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { useContext, useSyncExternalStore } from "react";
import { MotionConfigContext } from "motion/react";
const motionPreferenceQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotionPreference(notify: () => void) {
    const query = window.matchMedia(motionPreferenceQuery);
    query.addEventListener("change", notify);
    return () => query.removeEventListener("change", notify);
}
function readMotionPreference() {
    return window.matchMedia(motionPreferenceQuery).matches;
}
/** Follow live user preference and any stronger host policy; render still on the server. */
function useMotionPreference() {
    const preference = useSyncExternalStore(subscribeMotionPreference, readMotionPreference, () => true);
    const { reducedMotion } = useContext(MotionConfigContext);
    return reducedMotion === "always" || preference;
}
import "./copy-button.css";
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
/** Cancels pending visual work and invalidates older asynchronous results. */
function useSequence() {
    const revision = useRef(0);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const cancel = useCallback(() => {
        revision.current += 1;
        timers.current.forEach(clearTimeout);
        timers.current = [];
        return revision.current;
    }, []);
    const later = useCallback((id: number, delay: number, action: () => void) => {
        const timer = setTimeout(() => {
            timers.current = timers.current.filter((item) => item !== timer);
            if (revision.current === id)
                action();
        }, delay);
        timers.current.push(timer);
    }, []);
    useEffect(() => () => {
        cancel();
    }, [cancel]);
    return { cancel, later, revision };
}
type CopyButtonProps = FeedbackDemoProps & {
    text?: string;
};
type CopyState = "idle" | "pending" | "copied" | "error";
/** The clipboard write is real. Replay only resets the feedback; it never writes. */
function CopyButton({ speed: requestedSpeed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, text = "npm install motion", }: CopyButtonProps) {
    const speed = normalizeSpeed(requestedSpeed);
    const reduced = Boolean(useMotionPreference());
    const [feedback, setFeedback] = useState<{
        text: string;
        state: CopyState;
    }>({
        text,
        state: "idle",
    });
    // Reset the feedback before committing a changed payload, keeping the same
    // button DOM node and its focus. Results always carry their captured text.
    if (feedback.text !== text)
        setFeedback({ text, state: "idle" });
    const state = feedback.text === text ? feedback.state : "idle";
    const pendingCopy = useRef<number | null>(null);
    const { cancel, later, revision } = useSequence();
    useEffect(() => {
        cancel();
        pendingCopy.current = null;
    }, [text, cancel]);
    const reset = useCallback(() => {
        if (pendingCopy.current !== null)
            return;
        cancel();
        setFeedback({ text, state: "idle" });
    }, [cancel, text]);
    useReplay(replayKey, reset);
    async function copy() {
        if (pendingCopy.current !== null)
            return;
        const id = cancel();
        pendingCopy.current = id;
        setFeedback({ text, state: "pending" });
        try {
            if (!navigator.clipboard?.writeText)
                throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(text);
            if (revision.current !== id)
                return;
            setFeedback({ text, state: "copied" });
            later(id, 2200 / speed, () => setFeedback({ text, state: "idle" }));
        }
        catch {
            if (revision.current === id)
                setFeedback({ text, state: "error" });
        }
        finally {
            if (pendingCopy.current === id)
                pendingCopy.current = null;
        }
    }
    const label = state === "copied"
        ? "Copied"
        : state === "error"
            ? "Try copying again"
            : state === "pending"
                ? "Copying"
                : "Copy command";
    const Icon = state === "copied" ? Check : state === "error" ? TriangleAlert : Copy;
    return (<div data-preview={preview} className={`bf-preview bf-copy-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bf-main">
        <div className="bf-copy-block">
          <code className="bf-command" title={text}>
            {text}
          </code>
          <motion.button type="button" className="bf-copy-button" onClick={copy} disabled={state === "pending"} aria-label={label} aria-busy={state === "pending"} initial={false} animate={{
            width: state === "copied" ? 109 : state === "error" ? 165 : 153,
        }} transition={{ duration: reduced ? 0 : 0.36 / speed, ease: EASE }}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={state} className="bf-button-content" aria-hidden="true" initial={{
            opacity: 0,
            y: reduced ? 0 : 7,
            filter: reduced ? "blur(0px)" : "blur(3px)",
        }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{
            opacity: 0,
            y: reduced ? 0 : -7,
            filter: reduced ? "blur(0px)" : "blur(3px)",
        }} transition={{
            duration: reduced ? 0 : 0.22 / speed,
            ease: EASE,
        }}>
                <motion.span className="bf-icon" initial={{
            rotate: reduced ? 0 : state === "copied" ? -25 : 0,
            scale: reduced ? 1 : 0.8,
        }} animate={{ rotate: 0, scale: 1 }} transition={{
            duration: reduced ? 0 : 0.32 / speed,
            ease: EASE,
        }}>
                  <Icon size={15} strokeWidth={1.8}/>
                </motion.span>
                <span>{label}</span>
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <AnimatePresence initial={false}>
            {state === "error" && (<motion.label className="bf-manual-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.16 / speed }}>
                Copy manually
                <input value={text} readOnly onFocus={(event) => event.currentTarget.select()}/>
              </motion.label>)}
          </AnimatePresence>
        </div>
        <span className="bf-sr-only" role="status">
          {state === "copied"
            ? "Command copied to clipboard."
            : state === "error"
                ? "Clipboard unavailable. Select and copy the text in the manual copy field."
                : ""}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>
          {state === "copied"
            ? "Ready to paste"
            : state === "error"
                ? "Clipboard access unavailable"
                : "Copies to your clipboard"}
        </span>
        <button type="button" className="bf-small-button" aria-disabled={state === "idle" || state === "pending"} onClick={() => {
            if (state !== "idle")
                reset();
        }}>
          Reset
        </button>
      </div>
    </div>);
}
export { CopyButton };

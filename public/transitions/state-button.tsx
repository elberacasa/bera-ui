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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, RotateCcw, Save, TriangleAlert } from "lucide-react";
import "./state-button.css";
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
type SaveState = "idle" | "loading" | "success" | "error";
type StateButtonProps = FeedbackDemoProps & {
    /** Required for application use. Omit only with preview=true for a labeled simulation. */
    onAction?: () => Promise<void>;
};
/** Useful for save/submit feedback; the demo simulation can safely be restarted. */
function StateButton({ speed: requestedSpeed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, onAction, }: StateButtonProps) {
    const speed = normalizeSpeed(requestedSpeed);
    const reduced = Boolean(useReducedMotion());
    const [state, setState] = useState<SaveState>("idle");
    const pendingAction = useRef(false);
    const { cancel, later, revision } = useSequence();
    const duration = (seconds: number) => (reduced ? 0 : seconds / speed);
    const complete = useCallback((id: number) => {
        if (revision.current !== id)
            return;
        setState("success");
        later(id, 1450 / speed, () => setState("idle"));
    }, [later, revision, speed]);
    const run = useCallback(() => {
        if (pendingAction.current || (!onAction && !preview))
            return;
        const id = cancel();
        setState("loading");
        if (onAction) {
            pendingAction.current = true;
            // Promise.resolve also converts a synchronous throw into visible error feedback.
            Promise.resolve()
                .then(onAction)
                .then(() => {
                pendingAction.current = false;
                complete(id);
            }, () => {
                pendingAction.current = false;
                if (revision.current === id)
                    setState("error");
            });
        }
        else {
            later(id, 850 / speed, () => complete(id));
        }
    }, [cancel, complete, later, onAction, preview, revision, speed]);
    const replay = useCallback(() => {
        // A gallery replay must never repeat a real save or submit action.
        // Its promise cannot be cancelled by clearing a visual timer.
        if (pendingAction.current)
            return;
        if (onAction) {
            cancel();
            setState("idle");
        }
        else
            run();
    }, [cancel, onAction, run]);
    useReplay(replayKey, replay);
    const labels = {
        idle: "Save changes",
        loading: "Saving",
        success: "Saved",
        error: "Try again",
    };
    const widths = { idle: 164, loading: 132, success: 118, error: 146 };
    const Icon = {
        idle: Save,
        loading: LoaderCircle,
        success: Check,
        error: TriangleAlert,
    }[state];
    return (<div data-preview={preview} className={`bf-preview bf-save-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bf-main">
        <motion.button type="button" className="bf-state-button" disabled={(!preview && !onAction) ||
            state === "loading" ||
            state === "success"} aria-label={labels[state]} aria-busy={state === "loading"} onClick={run} initial={false} animate={{
            width: widths[state],
            borderRadius: state === "loading" ? 24 : Math.max(0, Math.min(24, radius)),
        }} transition={{ duration: duration(0.42), ease: EASE }}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={state} className="bf-button-content" initial={{
            opacity: 0,
            y: reduced ? 0 : 9,
            filter: reduced ? "blur(0px)" : "blur(4px)",
        }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{
            opacity: 0,
            y: reduced ? 0 : -7,
            filter: reduced ? "blur(0px)" : "blur(3px)",
        }} transition={{ duration: duration(0.24), ease: EASE }} aria-hidden="true">
              <motion.span className="bf-icon" animate={{ rotate: state === "loading" && !reduced ? 360 : 0 }} transition={state === "loading" && !reduced
            ? {
                duration: 0.8 / speed,
                repeat: Infinity,
                ease: "linear",
            }
            : { duration: 0 }}>
                <Icon size={16} strokeWidth={1.8}/>
              </motion.span>
              <span>{labels[state]}</span>
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <span className="bf-sr-only" role="status">
          {state === "success"
            ? "Changes saved."
            : state === "error"
                ? "The action failed. Try again."
                : ""}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>
          {state === "error"
            ? "Couldn’t save. Try again."
            : onAction
                ? "Connected to your action"
                : "Simulated save"}
        </span>
        {!onAction && (<button type="button" className="bf-small-button" onClick={replay}>
            <RotateCcw size={12} aria-hidden="true"/>
            Replay
          </button>)}
      </div>
    </div>);
}
export { StateButton };

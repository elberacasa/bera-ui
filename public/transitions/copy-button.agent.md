# Copy feedback

Copy a command. Confirm it right where you clicked.

## Choose this for

Copying a command, URL, identifier, or other text.

## Integration

Pass the exact text. Confirm only after the clipboard write succeeds and preserve the manual fallback.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `CopyButton`

Props: text, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [copy-button.tsx](https://bera-ui.vercel.app/transitions/copy-button.tsx)
Styles: [copy-button.css](https://bera-ui.vercel.app/transitions/copy-button.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `copy-button.tsx`:

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

```

Save as `copy-button.css`:

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
.bf-preview {
  --bf-ink: var(--foreground, #eeeeee);
  --bf-muted: var(--muted-foreground, #888888);
  --bf-panel: var(--popover, #191919);
  --bf-border: var(--border, #303030);
  --bf-primary: var(--primary, #eeeeee);
  --bf-primary-ink: var(--primary-foreground, #191919);
  --bf-highlight: color-mix(in srgb, var(--bf-ink) 7%, transparent);
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 320px;
  height: 230px;
  margin-inline: auto;
  color: var(--bf-ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.bf-preview *,
.bf-preview *::before,
.bf-preview *::after {
  box-sizing: border-box;
}
.bf-preview button,
.bf-preview input {
  font: inherit;
}
.bf-preview button {
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.bf-preview button:disabled {
  cursor: default;
}
.bf-preview button:focus-visible,
.bf-preview input:focus-visible {
  outline: 2px solid var(--ring, var(--bf-ink));
  outline-offset: 4px;
}
.bf-main {
  height: 187px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}
.bf-state-button,
.bf-copy-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  height: 48px;
  padding: 0;
  border: 1px solid
    color-mix(in srgb, var(--bf-primary) 78%, var(--bf-primary-ink));
  border-radius: var(--bera-radius, 13px);
  white-space: nowrap;
  font-size: 14px !important;
  font-weight: 550 !important;
  letter-spacing: -0.18px;
  background: var(--bf-primary);
  color: var(--bf-primary-ink);
  box-shadow:
    0 1px 0 #ffffff40 inset,
    0 1px 2px #00000024,
    0 4px 10px #00000014;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.bf-state-button:disabled:not([aria-busy="true"]),
.bf-copy-button:disabled {
  opacity: 0.72;
  box-shadow: none;
}
.bf-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  flex-shrink: 0;
  position: relative;
  white-space: nowrap;
}
.bf-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bf-icon svg {
  display: block;
  width: 17px;
  height: 17px;
}
.bf-demo-footer {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 17px;
  color: var(--bf-muted);
  font-size: 12px;
  line-height: 1.4;
}
.bf-small-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 5px 1px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--bf-ink);
  font-size: 12px !important;
  line-height: 1.4;
}
.bf-small-button:hover:not(:disabled, [aria-disabled="true"]) {
  color: var(--bf-ink);
}
.bf-small-button:disabled,
.bf-small-button[aria-disabled="true"] {
  cursor: default;
  opacity: 0.35;
}
.bf-status-line {
  position: relative;
  display: flex;
  align-items: center;
  width: 248px;
  max-width: 100%;
  min-height: 40px;
}
.bf-status-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.bf-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  color: color-mix(in srgb, var(--bf-ink) 75%, var(--bf-muted));
}
.bf-status-words {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.27em;
  font-size: 16px;
  font-weight: 450;
  letter-spacing: -0.38px;
  white-space: nowrap;
}
.bf-status-words > span {
  display: inline-block;
}
.bf-copy-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 20px;
}
.bf-command {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: color-mix(in srgb, var(--bf-ink) 75%, var(--bf-muted));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  letter-spacing: -0.25px;
}
.bf-copy-button {
  height: 44px;
  color: var(--bf-ink);
  background: var(--bf-panel);
  border: 1px solid var(--bf-border);
  border-radius: var(--bera-radius, 10px);
  box-shadow:
    0 1px 0 var(--bf-highlight) inset,
    0 1px 2px #00000026,
    0 3px 7px #00000014;
}
@media (hover: hover) {
  .bf-state-button:hover:not(:disabled) {
    background: color-mix(
      in srgb,
      var(--bf-primary) 95%,
      var(--bf-primary-ink)
    );
    border-color: color-mix(
      in srgb,
      var(--bf-primary) 88%,
      var(--bf-primary-ink)
    );
  }
  .bf-copy-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--bf-panel) 94%, var(--bf-ink));
    border-color: color-mix(in srgb, var(--bf-border) 78%, var(--bf-ink));
  }
}
.bf-state-button:active:not(:disabled) {
  background: color-mix(in srgb, var(--bf-primary) 89%, var(--bf-primary-ink));
  box-shadow: 0 1px 2px #00000020 inset;
}
.bf-copy-button:active:not(:disabled) {
  background: color-mix(in srgb, var(--bf-panel) 90%, var(--bf-ink));
  box-shadow: 0 1px 2px #00000024 inset;
}
.bf-manual-copy {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  max-width: 258px;
  color: var(--bf-muted);
  font-size: 12px;
}
.bf-manual-copy input {
  width: 100%;
  min-width: 0;
  height: 40px;
  border: 1px solid var(--bf-border);
  border-radius: 6px;
  padding: 5px 8px;
  background: var(--bf-panel);
  color: var(--bf-ink);
  font-size: 13px;
}
.bf-sr-only {
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
  .bf-preview *,
  .bf-preview *::before,
  .bf-preview *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
@media (pointer: coarse) {
  .bf-manual-copy input {
    min-height: 44px;
    font-size: 16px;
  }
}

/* Reference controls and the presentation frame are opt-in for galleries. */
.bf-preview[data-preview="false"] {
  height: auto;
  width: fit-content;
  max-width: 100%;
}
.bf-preview[data-preview="false"] .bf-main {
  height: auto;
  padding: 0;
}
.bf-preview[data-preview="false"] .bf-demo-footer {
  display: none;
}

```

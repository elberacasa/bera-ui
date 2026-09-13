# Confirm action

Make room for a deliberate second click.

## Choose this for

Confirming an archive, removal, reset, or other consequential action in context.

## Integration

Supply the real onConfirm operation. Opening only arms the control and focuses Cancel; Enter or Space cannot confirm through a held key. Cancel and Escape return to the original action before commitment. Pending operations cannot overlap or be canceled by closing the control. Rejection keeps confirmation available with an error; success persists until the host remounts for a restored or different resource. Keep resource state and restoration in the host. Without onConfirm the production control is disabled. The preview archives and restores local data only. Replay changes presentation without changing state, invoking callbacks, or moving focus.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `ConfirmAction`

Props: onConfirm, label, confirmLabel, cancelLabel, pendingLabel, successLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [confirm-action.tsx](https://bera-ui.vercel.app/transitions/confirm-action.tsx)
Styles: [confirm-action.css](https://bera-ui.vercel.app/transitions/confirm-action.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `confirm-action.tsx`:

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
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Archive, Check, LoaderCircle, RotateCcw } from "lucide-react";
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
import "./confirm-action.css";
type ConfirmActionProps = {
    /** Resolve only after the real operation succeeds; rejection keeps a retry available. */
    onConfirm?: () => void | Promise<void>;
    label?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    pendingLabel?: string;
    successLabel?: string;
    /** Enables a local archive/restore demonstration when no host action is supplied. */
    preview?: boolean;
    speed?: number;
    radius?: number;
    /** Presentation only. It never arms, confirms, cancels, or resets the operation. */
    replayKey?: number;
    className?: string;
    style?: CSSProperties;
};
/** One explicit confirmation followed by one real operation. Success persists until remount. */
function ConfirmAction({ onConfirm, label = "Archive project", confirmLabel = "Archive", cancelLabel = "Cancel", pendingLabel = "Archiving…", successLabel = "Archived", preview = false, speed = 1, radius = 12, replayKey = 0, className = "", style, }: ConfirmActionProps) {
    const [phase, setPhase] = useState<"idle" | "armed" | "pending" | "success">("idle");
    const [error, setError] = useState("");
    const [archived, setArchived] = useState(false);
    const [size, setSize] = useState({ available: 0, closed: 0, height: 44 });
    const host = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const measure = useRef<HTMLSpanElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const cancel = useRef<HTMLButtonElement>(null);
    const focusTarget = useRef<"cancel" | "trigger" | null>(null);
    const inFlight = useRef(false);
    const revision = useRef(0);
    const previousReplay = useRef(replayKey);
    const presentation = useAnimationControls();
    const reduced = useMotionPreference();
    const id = useId();
    const open = phase === "armed" || phase === "pending";
    const pending = phase === "pending";
    const successful = phase === "success";
    const localPreview = preview && !onConfirm;
    const available = Boolean(onConfirm) || localPreview;
    const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
    const corners = Number.isFinite(radius)
        ? Math.max(0, Math.min(24, radius))
        : 12;
    const displayed = successful ? successLabel : label;
    const measured = size.available > 0;
    const width = open ? size.available : size.closed;
    useLayoutEffect(() => {
        const update = () => {
            if (!host.current || !content.current || !measure.current)
                return;
            const available = host.current.getBoundingClientRect().width;
            if (!available)
                return;
            const closed = Math.min(available, Math.max(112, Math.ceil(measure.current.getBoundingClientRect().width) + 50));
            const height = Math.ceil(content.current.getBoundingClientRect().height);
            setSize((previous) => previous.available === available &&
                previous.closed === closed &&
                previous.height === height
                ? previous
                : { available, closed, height });
        };
        update();
        const observer = new ResizeObserver(update);
        if (host.current)
            observer.observe(host.current);
        if (content.current)
            observer.observe(content.current);
        if (measure.current)
            observer.observe(measure.current);
        return () => observer.disconnect();
    }, [open, displayed, error, confirmLabel, cancelLabel, pendingLabel]);
    useLayoutEffect(() => {
        const target = focusTarget.current === "cancel"
            ? cancel.current
            : focusTarget.current === "trigger"
                ? trigger.current
                : null;
        if (target?.getClientRects().length && !target.closest("[inert]"))
            target.focus({ preventScroll: true });
        focusTarget.current = null;
    }, [phase]);
    useEffect(() => () => {
        revision.current += 1;
        inFlight.current = false;
    }, []);
    useEffect(() => {
        const replayed = previousReplay.current !== replayKey;
        previousReplay.current = replayKey;
        if (reduced) {
            presentation.stop();
            presentation.set({ opacity: 1 });
            return;
        }
        if (!replayed)
            return;
        presentation.set({ opacity: 0.65 });
        void presentation.start({
            opacity: 1,
            transition: { duration: 0.24 / rate },
        });
    }, [presentation, reduced, replayKey, rate]);
    function arm() {
        if (!available || phase !== "idle" || inFlight.current)
            return;
        setError("");
        focusTarget.current = "cancel";
        setPhase("armed");
    }
    function dismiss() {
        if (!open || inFlight.current)
            return;
        setError("");
        focusTarget.current = "trigger";
        setPhase("idle");
    }
    function confirm() {
        if (phase !== "armed" || !available || inFlight.current)
            return;
        inFlight.current = true;
        const request = ++revision.current;
        setPhase("pending");
        setError("");
        Promise.resolve()
            .then(() => {
            if (onConfirm)
                return onConfirm();
            if (localPreview && revision.current === request)
                setArchived(true);
        })
            .then(() => {
            if (revision.current !== request)
                return;
            inFlight.current = false;
            if (host.current?.contains(document.activeElement))
                focusTarget.current = "trigger";
            setPhase("success");
        }, (reason: unknown) => {
            if (revision.current !== request)
                return;
            inFlight.current = false;
            setError(reason instanceof Error && reason.message
                ? reason.message
                : "The action could not be completed. Try again.");
            setPhase("armed");
        });
    }
    function restorePreview() {
        if (!localPreview || phase !== "success" || inFlight.current)
            return;
        setArchived(false);
        setError("");
        focusTarget.current = "trigger";
        setPhase("idle");
    }
    return (<div className={`bca-root ${className}`} data-preview={preview} data-reduced={reduced} style={{
            "--bera-radius": `${corners}px`,
            "--bca-duration": `${reduced ? 0 : 140 / rate}ms`,
            ...style,
        } as CSSProperties} onKeyDownCapture={(event) => {
            // Holding an activation key must never advance through two decisions.
            if ((event.repeat ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229) &&
                (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                event.stopPropagation();
            }
        }}>
      {preview && (<div className="bca-preview-heading">
          <div>
            <span>Website refresh</span>
            <small>
              {localPreview
                ? archived
                    ? "Archived locally"
                    : "Local preview"
                : "Uses your action"}
            </small>
          </div>
          {localPreview && (<button type="button" className="bca-restore" disabled={!successful} onClick={restorePreview} aria-label="Restore project">
              <RotateCcw size={13} aria-hidden="true"/>
              Restore
            </button>)}
        </div>)}
      <div className="bca-host" ref={host}>
        <span className="bca-measure-box" aria-hidden="true">
          <span className="bca-measure" ref={measure}>
            {displayed}
          </span>
        </span>
        <motion.div className="bca-surface" data-open={open} data-measured={measured} initial={false} animate={{
            width: measured ? width : undefined,
            height: measured ? size.height + 2 : undefined,
        }} transition={{
            type: "spring",
            duration: reduced ? 0 : 0.36 / rate,
            bounce: 0.04,
        }}>
          <motion.div ref={content} className="bca-content" style={{ width: measured ? Math.max(0, width - 2) : undefined }} animate={presentation}>
            {open ? (<div className="bca-confirmation" role="group" aria-label={`Confirm ${label.toLowerCase()}`} aria-busy={pending} onKeyDown={(event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    dismiss();
                }
            }}>
                <div className="bca-row">
                  <div className="bca-context" aria-hidden="true" onPointerDown={(event) => {
                // A second click on the former trigger keeps focus on the safe choice.
                event.preventDefault();
            }}>
                    <Archive size={16}/>
                    <span className="bca-label">{label}</span>
                  </div>
                  <motion.div className="bca-actions" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{
                duration: reduced ? 0 : 0.16 / rate,
                delay: reduced ? 0 : 0.05 / rate,
            }}>
                    <button ref={cancel} type="button" className="bca-cancel" aria-disabled={pending} onClick={dismiss}>
                      {cancelLabel}
                    </button>
                    <button type="button" className="bca-confirm" aria-disabled={pending} aria-describedby={error ? `${id}-error` : undefined} onClick={confirm}>
                      {pending && (<motion.span className="bca-progress" aria-hidden="true" animate={{ rotate: reduced ? 0 : 360 }} transition={reduced
                    ? { duration: 0 }
                    : {
                        duration: 0.8 / rate,
                        repeat: Infinity,
                        ease: "linear",
                    }}>
                          <LoaderCircle size={14}/>
                        </motion.span>)}
                      <span>{pending ? pendingLabel : confirmLabel}</span>
                    </button>
                  </motion.div>
                </div>
                {error && (<p className="bca-error" id={`${id}-error`} role="alert">
                    {error}
                  </p>)}
              </div>) : (<button ref={trigger} type="button" className="bca-trigger" disabled={!available} aria-disabled={successful || undefined} onClick={arm}>
                {successful ? (<Check size={16} aria-hidden="true"/>) : (<Archive size={16} aria-hidden="true"/>)}
                <span className="bca-label">{displayed}</span>
              </button>)}
          </motion.div>
        </motion.div>
        <span className="bca-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {pending
            ? pendingLabel
            : successful
                ? `${successLabel}${localPreview ? " in this local preview." : "."}`
                : ""}
        </span>
      </div>
      {preview && (<p className="bca-preview-note">
          {localPreview
                ? "Changes stay in this preview."
                : "Runs your confirm action."}
        </p>)}
    </div>);
}
export { ConfirmAction };

```

Save as `confirm-action.css`:

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
.bca-root {
  --bca-ink: var(--foreground, #eee);
  --bca-muted: var(
    --muted-foreground,
    color-mix(in srgb, var(--bca-ink) 65%, var(--background, #080808))
  );
  --bca-panel: var(--popover, var(--background, #171717));
  --bca-border: var(
    --border,
    color-mix(in srgb, var(--bca-ink) 18%, var(--background, #080808))
  );
  --bca-accent: var(
    --accent,
    color-mix(in srgb, var(--bca-ink) 6%, var(--background, #080808))
  );
  --bca-primary: var(--primary, var(--bca-ink));
  --bca-primary-ink: var(--primary-foreground, var(--background, #191919));
  --bca-ring: var(--ring, var(--bca-ink));
  box-sizing: border-box;
  width: 320px;
  max-width: 100%;
  color: var(--bca-ink);
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
}
.bca-root *,
.bca-root *::before,
.bca-root *::after {
  box-sizing: border-box;
}
.bca-root[data-preview="true"] {
  min-height: 240px;
  margin-inline: auto;
  padding: 24px 16px 16px;
}
.bca-host {
  position: relative;
  width: 100%;
  min-width: 0;
}
.bca-measure,
.bca-label {
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.01em;
}
.bca-measure-box {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
.bca-measure {
  display: inline-block;
  white-space: pre;
}
.bca-surface {
  position: relative;
  max-width: 100%;
  border: 1px solid var(--bca-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bca-panel);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--bca-ink) 4%, transparent);
}
.bca-content {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 0;
}
.bca-surface[data-measured="false"] {
  width: max-content;
}
.bca-surface[data-measured="false"] .bca-content {
  position: relative;
  width: max-content;
  max-width: 100%;
}
.bca-root button {
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.bca-root button:focus-visible {
  outline: 2px solid var(--bca-ring);
  outline-offset: 3px;
}
.bca-trigger,
.bca-context {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 44px;
  padding: 12px;
  color: var(--bca-ink);
}
.bca-trigger {
  width: 100%;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 1px));
  background: transparent;
  text-align: left;
  transition: background-color var(--bca-duration, 140ms);
}
.bca-trigger:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--bca-accent);
}
.bca-trigger:disabled,
.bca-trigger[aria-disabled="true"] {
  cursor: default;
}
.bca-trigger:disabled {
  color: var(--bca-muted);
}
.bca-trigger > svg,
.bca-context > svg {
  flex: none;
  color: var(--bca-muted);
}
.bca-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
.bca-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  min-width: 0;
}
.bca-context {
  flex: 1 1 max-content;
  max-width: 100%;
}
.bca-actions {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
  margin-left: auto;
  padding: 4px;
}
.bca-cancel,
.bca-confirm {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: 100%;
  min-width: 64px;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 5px));
  text-align: center;
  overflow-wrap: anywhere;
  transition:
    background-color var(--bca-duration, 140ms),
    color var(--bca-duration, 140ms);
}
.bca-cancel {
  background: transparent;
  color: var(--bca-muted);
}
.bca-cancel:hover:not([aria-disabled="true"]) {
  background: var(--bca-accent);
  color: var(--bca-ink);
}
.bca-confirm {
  background: var(--bca-primary);
  color: var(--bca-primary-ink);
  border-color: color-mix(
    in srgb,
    var(--bca-primary) 78%,
    var(--bca-primary-ink)
  );
  box-shadow: inset 0 1px 0
    color-mix(in srgb, var(--bca-primary-ink) 7%, transparent);
}
.bca-actions [aria-disabled="true"] {
  cursor: progress;
  opacity: 0.7;
}
.bca-confirm > span {
  min-width: 0;
}
.bca-progress {
  display: inline-flex;
  flex: none;
}
.bca-error {
  margin: 0;
  padding: 4px 12px 12px;
  color: var(--bca-ink);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.bca-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin-bottom: 12px;
}
.bca-preview-heading > div {
  min-width: 0;
}
.bca-preview-heading > div > span {
  display: block;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
}
.bca-preview-heading small {
  display: block;
  margin-top: 2px;
  color: var(--bca-muted);
  font-size: 12px;
  line-height: 18px;
}
.bca-restore {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  gap: 5px;
  min-height: 44px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  color: var(--bca-muted);
  background: transparent;
}
.bca-restore:disabled {
  opacity: 0.45;
  cursor: default;
}
.bca-preview-note {
  margin: 14px 0 0;
  color: var(--bca-muted);
  font-size: 12px;
  line-height: 18px;
}
.bca-sr-only {
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
.bca-root[data-reduced="true"] *,
.bca-root[data-reduced="true"] *::before,
.bca-root[data-reduced="true"] *::after {
  transition-duration: 0s !important;
}

```

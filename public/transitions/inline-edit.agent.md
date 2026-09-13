# Inline edit

Rename in place. Keep the context.

## Choose this for

Project names, short titles, and metadata that can be edited in place.

## Integration

Connect value and onCommit to the actual update. Resolve only after saving succeeds, reject on failure, and update the controlled value after acceptance. Optional validate returns a readable error. Enter saves; Escape or Cancel discards an idle draft. During a pending save, Escape or Close only hides the editor: the operation continues and new commits remain blocked until settlement. Composition input never submits early. The preview changes local data only. Replay must not save or move focus.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `InlineEdit`

Props: value, defaultValue, onCommit, validate, label, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [inline-edit.tsx](https://bera-ui.vercel.app/transitions/inline-edit.tsx)
Styles: [inline-edit.css](https://bera-ui.vercel.app/transitions/inline-edit.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `inline-edit.tsx`:

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
import { Check, LoaderCircle, PencilLine } from "lucide-react";
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
import "./inline-edit.css";
type InlineEditProps = {
    value?: string;
    defaultValue?: string;
    /** Required for application editing. Resolution means the real save completed. */
    onCommit?: (value: string) => void | Promise<void>;
    /** Return an error to keep the draft open. The default rejects blank values. */
    validate?: (value: string) => string | undefined;
    label?: string;
    preview?: boolean;
    speed?: number;
    radius?: number;
    replayKey?: number;
    className?: string;
    style?: CSSProperties;
};
/** An explicit save transaction. Controlled display text always belongs to the host. */
function InlineEdit({ value, defaultValue, onCommit, validate, label = "Project name", preview = false, speed = 1, radius = 12, replayKey = 0, className = "", style, }: InlineEditProps) {
    const [localValue, setLocalValue] = useState(defaultValue ?? (preview ? "Website refresh" : ""));
    const displayed = value ?? localValue;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(displayed);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [announcement, setAnnouncement] = useState("");
    const [saved, setSaved] = useState(false);
    const [size, setSize] = useState({ available: 0, closed: 0, height: 44 });
    const measured = size.available > 0;
    const host = useRef<HTMLDivElement>(null);
    const measure = useRef<HTMLSpanElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const focusTarget = useRef<"input" | "trigger" | null>(null);
    const composing = useRef(false);
    const revision = useRef(0);
    const pendingRevision = useRef<number | null>(null);
    const previousReplay = useRef(replayKey);
    const presentation = useAnimationControls();
    const reduced = useMotionPreference();
    const id = useId();
    const rate = Number.isFinite(speed) && speed > 0 ? Math.max(0.1, speed) : 1;
    const corners = Number.isFinite(radius)
        ? Math.max(0, Math.min(24, radius))
        : 12;
    const canEdit = Boolean(onCommit) || (preview && value === undefined);
    const width = editing ? size.available : size.closed;
    useLayoutEffect(() => {
        const update = () => {
            if (!host.current || !measure.current || !content.current)
                return;
            const available = host.current.getBoundingClientRect().width;
            if (!available)
                return;
            const closed = Math.min(available, Math.max(112, Math.ceil(measure.current.getBoundingClientRect().width) + 56));
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
        if (measure.current)
            observer.observe(measure.current);
        if (content.current)
            observer.observe(content.current);
        return () => observer.disconnect();
    }, [editing, displayed, error]);
    useLayoutEffect(() => {
        const target = focusTarget.current === "input"
            ? input.current
            : focusTarget.current === "trigger"
                ? trigger.current
                : null;
        if (target?.getClientRects().length) {
            target.focus({ preventScroll: true });
            if (target === input.current)
                input.current?.select();
        }
        focusTarget.current = null;
    }, [editing]);
    useEffect(() => () => {
        revision.current += 1;
        pendingRevision.current = null;
    }, []);
    useEffect(() => {
        if (previousReplay.current === replayKey) {
            if (reduced) {
                presentation.stop();
                presentation.set({ opacity: 1 });
            }
            return;
        }
        previousReplay.current = replayKey;
        // Replay touches presentation only: draft, selection, focus, and save stay intact.
        presentation.set({ opacity: reduced ? 1 : 0.72 });
        void presentation.start({
            opacity: 1,
            transition: { duration: reduced ? 0 : 0.28 / rate },
        });
    }, [replayKey, presentation, rate, reduced]);
    function edit() {
        if (!canEdit || pendingRevision.current !== null)
            return;
        revision.current += 1;
        if (!error)
            setDraft(displayed);
        setError("");
        setAnnouncement("");
        setSaved(false);
        composing.current = false;
        focusTarget.current = "input";
        setEditing(true);
    }
    function close() {
        // Closing never cancels an accepted save or unlocks a second host write.
        if (pendingRevision.current === null) {
            revision.current += 1;
            setError("");
            setAnnouncement("");
        }
        composing.current = false;
        focusTarget.current = "trigger";
        setEditing(false);
    }
    function commit() {
        if (!editing ||
            pendingRevision.current !== null ||
            composing.current ||
            !canEdit)
            return;
        let message: string | undefined;
        try {
            message = validate
                ? validate(draft)
                : draft.trim()
                    ? undefined
                    : "Enter a value.";
        }
        catch (reason) {
            message =
                reason instanceof Error
                    ? reason.message
                    : "Check this value and try again.";
        }
        if (message) {
            setError(message);
            input.current?.focus({ preventScroll: true });
            return;
        }
        if (draft === displayed) {
            close();
            return;
        }
        const submitted = draft;
        const request = ++revision.current;
        pendingRevision.current = request;
        setPending(true);
        setError("");
        setAnnouncement("");
        Promise.resolve()
            .then(() => onCommit?.(submitted))
            .then(() => {
            if (revision.current !== request)
                return;
            pendingRevision.current = null;
            setPending(false);
            setLocalValue(submitted);
            setSaved(true);
            setAnnouncement(onCommit ? `${label} saved.` : `${label} updated in this preview.`);
            // A completed request never steals focus back from another part of the page.
            if (input.current && host.current?.contains(document.activeElement))
                focusTarget.current = "trigger";
            setEditing(false);
        }, (reason: unknown) => {
            if (revision.current !== request)
                return;
            pendingRevision.current = null;
            setPending(false);
            const message = reason instanceof Error && reason.message
                ? reason.message
                : "Could not save. Try again.";
            setError(message);
            if (!input.current)
                setAnnouncement(`${label} could not be saved. ${message}`);
            if (host.current?.contains(document.activeElement))
                input.current?.focus({ preventScroll: true });
        });
    }
    return (<div className={`bie-root ${className}`} data-preview={preview} data-reduced={reduced} style={{
            "--bera-radius": `${corners}px`,
            "--bie-duration": `${reduced ? 0 : 160 / rate}ms`,
            ...style,
        } as CSSProperties}>
      <div className="bie-host" ref={host}>
        <span className="bie-caption" id={`${id}-label`}>
          {label}
        </span>
        <span className="bie-measure-box" aria-hidden="true">
          <span className="bie-measure" ref={measure}>
            {displayed || "Untitled"}
          </span>
        </span>
        <motion.div className="bie-surface" data-editing={editing} data-pending={pending} data-measured={measured} initial={false} animate={{
            width: measured ? width : undefined,
            height: size.height + 2,
        }} transition={{
            type: "spring",
            duration: reduced ? 0 : 0.4 / rate,
            bounce: 0.06,
        }}>
          <motion.div className="bie-content" ref={content} style={{ width: measured ? Math.max(0, width - 2) : undefined }} animate={presentation}>
            {editing ? (<div className="bie-form" role="group" aria-labelledby={`${id}-label`} aria-busy={pending} onKeyDown={(event) => {
                const isComposing = composing.current ||
                    event.nativeEvent.isComposing ||
                    event.keyCode === 229;
                if (isComposing) {
                    if (event.key === "Enter")
                        event.preventDefault();
                    return;
                }
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }
                if (event.key === "Enter" && event.target === input.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    commit();
                }
            }}>
                <input ref={input} className="bie-input" aria-labelledby={`${id}-label`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} value={draft} readOnly={pending} autoComplete="off" spellCheck={false} onChange={(event) => {
                if (!pendingRevision.current) {
                    setDraft(event.target.value);
                    setError("");
                }
            }} onCompositionStart={() => {
                composing.current = true;
            }} onCompositionEnd={() => {
                composing.current = false;
            }}/>
                {error && (<p className="bie-error" id={`${id}-error`} role="alert">
                    {error}
                  </p>)}
                <motion.div className="bie-actions" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -3 }} animate={{ opacity: 1, y: 0 }} transition={{
                duration: reduced ? 0 : 0.18 / rate,
                delay: reduced ? 0 : 0.06 / rate,
            }}>
                  <button className="bie-cancel" type="button" onClick={close}>
                    {pending ? "Close" : "Cancel"}
                  </button>
                  <button className="bie-save" type="button" aria-disabled={pending} onClick={commit}>
                    <motion.span aria-hidden="true" animate={{ rotate: pending && !reduced ? 360 : 0 }} transition={pending && !reduced
                ? {
                    duration: 0.8 / rate,
                    repeat: Infinity,
                    ease: "linear",
                }
                : { duration: 0 }}>
                      {pending ? (<LoaderCircle size={15}/>) : (<Check size={15}/>)}
                    </motion.span>
                    {pending ? "Saving" : "Save"}
                  </button>
                </motion.div>
              </div>) : (<button className="bie-trigger" ref={trigger} type="button" aria-label={`Edit ${label.toLowerCase()}`} aria-describedby={`${id}-value`} disabled={!canEdit} aria-disabled={pending || undefined} aria-busy={pending || undefined} onClick={edit}>
                <span className="bie-value" id={`${id}-value`}>
                  {displayed || "Untitled"}
                </span>
                {canEdit && (<span className="bie-glyph" aria-hidden="true">
                    {pending ? (<LoaderCircle size={15}/>) : saved ? (<Check size={15}/>) : (<PencilLine size={15}/>)}
                  </span>)}
              </button>)}
          </motion.div>
        </motion.div>
        <span className="bie-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {pending ? `Saving ${label.toLowerCase()}.` : announcement}
        </span>
        {preview && (<p className="bie-preview-note">
            {onCommit
                ? "Uses your save action."
                : value !== undefined
                    ? "Connect a save action to edit."
                    : "Changes stay in this preview."}
          </p>)}
      </div>
    </div>);
}
export { InlineEdit };

```

Save as `inline-edit.css`:

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
.bie-root {
  --bie-ink: var(--foreground, #eee);
  --bie-muted: var(
    --muted-foreground,
    color-mix(in srgb, var(--bie-ink) 65%, var(--background, #080808))
  );
  --bie-panel: var(--popover, var(--background, #171717));
  --bie-border: var(
    --border,
    color-mix(in srgb, var(--bie-ink) 18%, var(--background, #080808))
  );
  --bie-accent: var(
    --accent,
    color-mix(in srgb, var(--bie-ink) 6%, var(--background, #080808))
  );
  --bie-primary: var(--primary, var(--bie-ink));
  --bie-primary-ink: var(--primary-foreground, var(--background, #191919));
  --bie-ring: var(--ring, var(--bie-ink));
  display: inline-flex;
  box-sizing: border-box;
  align-items: center;
  width: 320px;
  max-width: 100%;
  color: var(--bie-ink);
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
}
.bie-root *,
.bie-root *::before,
.bie-root *::after {
  box-sizing: border-box;
}
.bie-root[data-preview="true"] {
  align-items: flex-start;
  min-height: 240px;
  margin-inline: auto;
  padding: 48px 16px 16px;
}
.bie-host {
  position: relative;
  width: 100%;
  min-width: 0;
}
.bie-caption {
  display: block;
  margin-bottom: 10px;
  padding-inline: 13px;
  color: var(--bie-muted);
  font-size: 12px;
  line-height: 18px;
}
.bie-measure,
.bie-value,
.bie-root .bie-input {
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.015em;
}
.bie-root[data-preview="true"] .bie-measure,
.bie-root[data-preview="true"] .bie-value,
.bie-root[data-preview="true"] .bie-input {
  font-size: 20px;
  line-height: 28px;
}
.bie-root[data-preview="true"] .bie-trigger,
.bie-root[data-preview="true"] .bie-input {
  padding-block: 8px;
}
.bie-measure-box {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
.bie-measure {
  display: inline-block;
  white-space: pre;
}
.bie-surface {
  position: relative;
  isolation: isolate;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: var(--bera-radius, 12px);
  background: transparent;
  transition:
    background-color var(--bie-duration, 160ms),
    border-color var(--bie-duration, 160ms),
    box-shadow var(--bie-duration, 160ms);
}
.bie-surface[data-editing="true"] {
  border-color: var(--bie-border);
  background: var(--bie-panel);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--bie-ink) 4%, transparent);
}
.bie-content {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 0;
}
.bie-surface[data-measured="false"] {
  width: max-content;
}
.bie-surface[data-measured="false"] .bie-content {
  position: relative;
  width: max-content;
  max-width: 100%;
}
.bie-root button {
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.bie-root button:focus-visible {
  outline: 2px solid var(--bie-ring);
  outline-offset: 3px;
}
.bie-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 1px));
  background: transparent;
  color: var(--bie-ink);
  text-align: left;
}
.bie-trigger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--bie-ink) 5%, transparent);
}
.bie-trigger:disabled {
  cursor: default;
}
.bie-trigger[aria-disabled="true"] {
  cursor: progress;
  color: var(--bie-muted);
}
.bie-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bie-glyph {
  display: inline-flex;
  flex: none;
  color: var(--bie-muted);
}
.bie-form {
  margin: 0;
  width: 100%;
  min-width: 0;
}
.bie-root .bie-input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 10px 12px;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 1px))
    max(0px, calc(var(--bera-radius, 12px) - 1px)) 0 0;
  outline: 0;
  background: transparent;
  color: var(--bie-ink);
  caret-color: var(--bie-ink);
  box-shadow: none;
}
.bie-input:focus-visible {
  outline: 0;
  box-shadow: inset 0 -1px 0 var(--bie-muted);
}
.bie-input[readonly] {
  color: var(--bie-muted);
}
.bie-error {
  margin: 0;
  padding: 0 12px 10px;
  color: var(--bie-ink);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.bie-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid color-mix(in srgb, var(--bie-border) 65%, transparent);
}
.bie-cancel,
.bie-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 76px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 5px));
  font-size: 13px !important;
}
.bie-cancel {
  background: transparent;
  color: var(--bie-muted);
}
.bie-cancel:hover {
  background: var(--bie-accent);
  color: var(--bie-ink);
}
.bie-save {
  min-width: 90px;
  background: var(--bie-primary);
  color: var(--bie-primary-ink);
  border-color: color-mix(
    in srgb,
    var(--bie-primary) 78%,
    var(--bie-primary-ink)
  );
  box-shadow: inset 0 1px 0
    color-mix(in srgb, var(--bie-primary-ink) 7%, transparent);
}
.bie-save[aria-disabled="true"] {
  cursor: progress;
  opacity: 0.78;
}
.bie-save span {
  display: inline-flex;
}
.bie-preview-note {
  margin: 14px 0 0;
  padding-inline: 13px;
  color: var(--bie-muted);
  font-size: 12px;
  line-height: 18px;
}
.bie-sr-only {
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
.bie-root[data-reduced="true"] *,
.bie-root[data-reduced="true"] *::before,
.bie-root[data-reduced="true"] *::after {
  transition-duration: 0s !important;
}
@media (pointer: coarse) {
  .bie-measure,
  .bie-value,
  .bie-root .bie-input {
    font-size: 16px;
  }
}

```

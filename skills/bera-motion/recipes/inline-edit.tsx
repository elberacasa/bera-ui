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

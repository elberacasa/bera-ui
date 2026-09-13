# Selection toolbar

Actions take shape around your selection.

## Choose this for

Bulk actions for selected files, messages, or table rows.

## Integration

Connect count, actions, and onClear to host-owned selection. Each action calls its real onSelect operation; pending and failure follow its promise. The host clears or updates selection after acceptance. Supply returnFocusRef for focused controls that disappear; unrelated focus stays put. Preview archive and restore affect local sample files only. Replay never calls actions.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `SelectionToolbar`

Props: count, actions, onClear, returnFocusRef, ariaLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [selection-toolbar.tsx](https://bera-ui.vercel.app/transitions/selection-toolbar.tsx)
Styles: [selection-toolbar.css](https://bera-ui.vercel.app/transitions/selection-toolbar.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `selection-toolbar.tsx`:

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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Archive, Check, FileText, RotateCcw, Square, X } from "lucide-react";
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
import "./selection-toolbar.css";
type SelectionToolbarAction = {
    id: string;
    label: string;
    icon?: ReactNode;
    onSelect: () => void | Promise<void>;
};
interface SelectionToolbarProps {
    /** Selection belongs to the host. Resolving an action never changes this count. */
    count?: number;
    actions?: readonly SelectionToolbarAction[];
    onClear?: () => void;
    /** Focus returns here only when a focused toolbar closes. Otherwise the host owns focus. */
    returnFocusRef?: RefObject<HTMLElement | null>;
    ariaLabel?: string;
    /** Enables the local file-selection and archive example instead of host actions. */
    preview?: boolean;
    speed?: number;
    radius?: number;
    /** Replays the count's visual settle; never selects, clears, or invokes an action. */
    replayKey?: number;
    className?: string;
    style?: CSSProperties;
}
const noActions: readonly SelectionToolbarAction[] = [];
function SelectionToolbarControl({ count = 0, actions = noActions, onClear, returnFocusRef, ariaLabel = "Selection actions", speed = 1, radius = 12, replayKey = 0, className = "", style, }: SelectionToolbarProps) {
    const selected = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    const open = selected > 0;
    const reduced = useMotionPreference();
    const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
    const container = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const focusWithin = useRef(false);
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const previousReplay = useRef(replayKey);
    const [size, setSize] = useState({ width: 280, height: 56 });
    const [pending, setPending] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const width = useMotionValue(open ? 280 : 148);
    const height = useMotionValue(open ? 56 : 44);
    const reveal = useMotionValue(open ? 1 : 0);
    const countSettle = useMotionValue(0);
    const actionY = useTransform(reveal, [0, 1], [5, 0]);
    useLayoutEffect(() => {
        const host = container.current;
        const body = content.current;
        if (!host || !body)
            return;
        const measure = () => {
            const next = { width: host.clientWidth, height: body.offsetHeight + 2 };
            setSize((current) => current.width === next.width && current.height === next.height
                ? current
                : next);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(host);
        observer.observe(body);
        measure();
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useLayoutEffect(() => {
        if (open || !focusWithin.current)
            return;
        focusWithin.current = false;
        const target = returnFocusRef?.current;
        // Never focus an invisible mirror or move focus that already left the toolbar.
        if (target?.getClientRects().length &&
            !target.closest("[inert]") &&
            !target.matches(":disabled"))
            target.focus({ preventScroll: true });
    }, [open, returnFocusRef]);
    useEffect(() => {
        const targetWidth = open ? size.width : Math.min(148, size.width);
        const targetHeight = open ? size.height : 44;
        if (reduced) {
            width.jump(targetWidth);
            height.jump(targetHeight);
            reveal.jump(open ? 1 : 0);
            return;
        }
        // Numeric motion values retain their current position and velocity on reversal.
        const spring = {
            type: "spring" as const,
            stiffness: 420 * rate * rate,
            damping: 35 * rate,
            mass: 0.9,
        };
        const playback = [
            animate(width, targetWidth, spring),
            animate(height, targetHeight, spring),
            animate(reveal, open ? 1 : 0, {
                duration: (open ? 0.2 : 0.1) / rate,
                ease: "easeOut",
            }),
        ];
        return () => playback.forEach((animation) => animation.stop());
    }, [open, size.width, size.height, rate, reduced, width, height, reveal]);
    useEffect(() => {
        if (reduced) {
            previousReplay.current = replayKey;
            countSettle.jump(0);
            return;
        }
        if (previousReplay.current === replayKey)
            return;
        previousReplay.current = replayKey;
        const playback = animate(countSettle, [0, -3, 0], {
            duration: 0.36 / rate,
            ease: "easeInOut",
        });
        return () => {
            playback.stop();
            countSettle.set(0);
        };
    }, [replayKey, rate, reduced, countSettle]);
    async function run(action: SelectionToolbarAction) {
        if (!open || inFlight.current)
            return;
        inFlight.current = true;
        setPending(action.id);
        setError(null);
        try {
            await action.onSelect();
        }
        catch (failure) {
            if (mounted.current)
                setError(failure instanceof Error && failure.message
                    ? failure.message
                    : `${action.label} could not be completed. Try again.`);
        }
        finally {
            inFlight.current = false;
            if (mounted.current)
                setPending(null);
        }
    }
    return (<div ref={container} className={`bst-toolbar ${className}`} data-open={open} style={{
            "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
            ...style,
        } as CSSProperties}>
      <motion.div className="bst-surface" style={{ width, height }}>
        <div ref={content} className="bst-content" style={{ width: Math.max(0, size.width - 2) }}>
          <div className="bst-count" aria-live="polite" aria-atomic="true">
            <motion.span className="bst-count-mark" style={{ y: countSettle }} aria-hidden="true">
              {open ? (<Check size={15} strokeWidth={2}/>) : (<Square size={15} strokeWidth={1.5}/>)}
            </motion.span>
            <span>
              {open ? (<>
                  <strong>{selected}</strong> selected
                </>) : ("Select items")}
            </span>
          </div>
          <motion.div className="bst-controls" role="group" aria-label={ariaLabel} aria-busy={pending !== null} aria-hidden={!open} inert={!open} style={{ opacity: reveal, y: actionY }} onFocusCapture={() => {
            focusWithin.current = true;
        }} onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget) &&
                (open || event.relatedTarget))
                focusWithin.current = false;
        }}>
            {actions.map((action) => (<button key={action.id} type="button" className="bst-action" disabled={pending !== null} aria-busy={pending === action.id} onClick={() => {
                void run(action);
            }}>
                {action.icon ? (<span className="bst-action-icon" aria-hidden="true">
                    {action.icon}
                  </span>) : null}
                <span>{action.label}</span>
              </button>))}
            {onClear ? (<button type="button" className="bst-clear" aria-label="Clear selection" disabled={pending !== null} onClick={() => {
                if (open && !inFlight.current)
                    onClear();
            }}>
                <X size={16} aria-hidden="true"/>
              </button>) : null}
          </motion.div>
          {error && open ? (<p className="bst-error" role="alert">
              {error}
            </p>) : null}
          <span className="bst-sr-only" role="status">
            {pending !== null
            ? `${actions.find((action) => action.id === pending)?.label ?? "Action"} in progress.`
            : ""}
          </span>
        </div>
      </motion.div>
    </div>);
}
const previewFiles = [
    { id: "brief", name: "Project brief", detail: "Document" },
    { id: "notes", name: "Meeting notes", detail: "Document" },
    { id: "assets", name: "Brand assets", detail: "Folder" },
] as const;
function SelectionToolbarPreview({ speed, radius, replayKey, className = "", style, }: SelectionToolbarProps) {
    const [files, setFiles] = useState<readonly (typeof previewFiles)[number][]>(previewFiles);
    const [selected, setSelected] = useState<readonly string[]>([]);
    const [announcement, setAnnouncement] = useState("");
    const returnFocus = useRef<HTMLElement | null>(null);
    const restore = useRef<HTMLButtonElement>(null);
    const archived = previewFiles.length - files.length;
    const archive = () => {
        const removed = selected.length;
        setFiles((current) => current.filter((file) => !selected.includes(file.id)));
        setSelected([]);
        setAnnouncement(`${removed} ${removed === 1 ? "file" : "files"} archived in this local preview.`);
    };
    return (<div className={`bst-preview ${className}`} data-preview="true" style={style}>
      <div className="bst-preview-heading">
        <span>Preview selection</span>
        <button ref={restore} type="button" className="bst-restore" disabled={!archived} onClick={() => {
            setFiles(previewFiles);
            setSelected([]);
            setAnnouncement("Preview files restored.");
        }}>
          <RotateCcw size={13} aria-hidden="true"/> Restore
        </button>
      </div>
      <div className="bst-files" role="group" aria-label="Preview files">
        {files.map((file, index) => (<label className="bst-file" key={file.id}>
            <input ref={index === 0
                ? (element) => {
                    returnFocus.current = element ?? restore.current;
                }
                : undefined} type="checkbox" checked={selected.includes(file.id)} onChange={(event) => setSelected((current) => event.target.checked
                ? [...current, file.id]
                : current.filter((id) => id !== file.id))}/>
            <FileText size={16} aria-hidden="true"/>
            <span>{file.name}</span>
            <span className="bst-file-detail">{file.detail}</span>
          </label>))}
        {!files.length ? (<p className="bst-empty">All preview files archived.</p>) : null}
      </div>
      <SelectionToolbarControl count={selected.length} actions={[
            {
                id: "archive",
                label: "Archive",
                icon: <Archive size={16}/>,
                onSelect: archive,
            },
        ]} onClear={() => setSelected([])} returnFocusRef={returnFocus} speed={speed} radius={radius} replayKey={replayKey}/>
      <span className="bst-sr-only" role="status">
        {announcement}
      </span>
    </div>);
}
/** A count unfolds into real host actions; preview=true provides a local file example. */
function SelectionToolbar({ preview = false, ...props }: SelectionToolbarProps) {
    return preview ? (<SelectionToolbarPreview {...props}/>) : (<SelectionToolbarControl {...props}/>);
}
export { SelectionToolbar };

```

Save as `selection-toolbar.css`:

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
.bst-toolbar,
.bst-preview {
  --bst-ink: var(--foreground, #ededed);
  --bst-muted: var(--muted-foreground, #929292);
  --bst-panel: var(--popover, #151515);
  --bst-border: var(--border, #2a2a2a);
  --bst-highlight: color-mix(in srgb, var(--bst-ink) 6%, transparent);
  width: min(100%, 320px);
  min-width: 0;
  color: var(--bst-ink);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
}
.bst-toolbar *,
.bst-preview *,
.bst-toolbar *::before,
.bst-preview *::before {
  box-sizing: border-box;
}
.bst-toolbar {
  display: grid;
  justify-items: center;
}
.bst-surface {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--bst-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bst-panel);
  box-shadow:
    0 3px 8px #0002,
    inset 0 1px var(--bst-highlight);
}
.bst-content {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0 6px;
  width: 100%;
  min-width: 0;
  padding: 5px;
}
.bst-count {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  height: 44px;
  padding-inline: 7px;
  white-space: nowrap;
  color: var(--bst-muted);
}
.bst-toolbar[data-open="false"] .bst-count {
  height: 32px;
}
.bst-toolbar[data-open="true"] .bst-count {
  color: var(--bst-ink);
}
.bst-count strong {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.bst-count-mark {
  display: grid;
  place-items: center;
  flex: none;
  color: var(--bst-muted);
}
.bst-toolbar[data-open="true"] .bst-count-mark {
  color: var(--bst-ink);
}
.bst-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 0 auto;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}
.bst-toolbar button,
.bst-preview button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: max(6px, calc(var(--bera-radius, 12px) - 5px));
  color: var(--bst-ink);
  background: transparent;
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.bst-toolbar .bst-action {
  background: color-mix(in srgb, var(--bst-ink) 7%, var(--bst-panel));
  box-shadow: inset 0 0 0 1px var(--bst-highlight);
}
.bst-action-icon {
  display: inline-flex;
  align-items: center;
  flex: none;
}
.bst-action-icon svg {
  width: 16px;
  height: 16px;
}
.bst-toolbar .bst-clear {
  width: 44px;
  padding: 0;
  color: var(--bst-muted);
}
@media (hover: hover) {
  .bst-toolbar button:hover:not(:disabled),
  .bst-preview button:hover:not(:disabled) {
    color: var(--bst-ink);
    background: color-mix(in srgb, var(--bst-ink) 12%, var(--bst-panel));
  }
  .bst-file:hover {
    background: color-mix(in srgb, var(--bst-ink) 4%, transparent);
  }
}
.bst-toolbar button:active:not(:disabled),
.bst-preview button:active:not(:disabled) {
  background: color-mix(in srgb, var(--bst-ink) 16%, var(--bst-panel));
}
.bst-toolbar button:focus-visible,
.bst-preview button:focus-visible,
.bst-file input:focus-visible {
  outline: 2px solid var(--ring, var(--bst-ink));
  outline-offset: -3px;
}
.bst-toolbar button:disabled,
.bst-preview button:disabled {
  cursor: default;
  opacity: 0.45;
}
.bst-toolbar button[aria-busy="true"] {
  opacity: 0.75;
}
.bst-error {
  flex-basis: 100%;
  margin: 0;
  padding: 7px;
  color: var(--bst-ink);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.bst-preview {
  display: grid;
  align-content: center;
  margin-inline: auto;
}
.bst-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  color: var(--bst-muted);
  font-size: 12px;
}
.bst-preview .bst-restore {
  font-size: 12px;
  padding-inline: 6px;
}
.bst-files {
  min-height: 132px;
  margin-bottom: 10px;
}
.bst-file {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 4px;
  border-radius: 7px;
  cursor: pointer;
}
.bst-file input {
  appearance: none;
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  margin: 0 2px 0 0;
  border: 1px solid var(--input, #3b3b3b);
  border-radius: 5px;
  background: var(--bst-panel);
  color: var(--primary-foreground, #151515);
  cursor: pointer;
}
.bst-file input:checked {
  border-color: var(--primary, #ededed);
  background: var(--primary, #ededed);
}
.bst-file input:checked::before {
  content: "";
  width: 11px;
  height: 9px;
  background: currentColor;
  clip-path: polygon(0 48%, 14% 34%, 40% 61%, 85% 6%, 100% 19%, 41% 94%);
}
.bst-file > svg {
  flex: none;
  color: var(--bst-muted);
}
.bst-file-detail {
  margin-left: auto;
  font-size: 12px;
  color: var(--bst-muted);
}
.bst-empty {
  display: grid;
  place-items: center;
  min-height: 132px;
  margin: 0;
  color: var(--bst-muted);
  font-size: 13px;
}
.bst-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
@media (forced-colors: active) {
  .bst-file input {
    appearance: auto;
  }
  .bst-file input::before {
    display: none;
  }
}

```

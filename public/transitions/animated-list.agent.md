# Animated list

Add, remove, and rearrange without losing your place.

## Choose this for

Changing file lists, search results, queues, or selected items.

## Integration

Supply items with unique stable IDs and React content. The host owns insertion, removal, sorting, and focus after its own commands. Keep business actions in the host; this recipe supplies list semantics and motion. Exiting rows leave the focus order immediately. Replay never changes host data or repeats actions.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `AnimatedList`

Props: items, emptyState, ariaLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [animated-list.tsx](https://bera-ui.vercel.app/transitions/animated-list.tsx)
Styles: [animated-list.css](https://bera-ui.vercel.app/transitions/animated-list.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `animated-list.tsx`:

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
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimationControls, useIsPresent } from "motion/react";
import { FileCode2, FileText, Plus, X } from "lucide-react";
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
import "./animated-list.css";
type AnimatedListItem = {
    id: string;
    content: ReactNode;
};
type AnimatedListProps = {
    /** Stable, unique IDs preserve the host's content and controls across reorder. */
    items?: readonly AnimatedListItem[];
    emptyState?: ReactNode;
    ariaLabel?: string;
    className?: string;
    style?: CSSProperties;
    speed?: number;
    radius?: number;
    /** With supplied items, replays presentation only; no items or focus change. */
    replayKey?: number;
    /** Opt in to a local file-list demonstration and its mutation controls. */
    preview?: boolean;
};
type ListRowProps = {
    item: AnimatedListItem;
    index: number;
    speed: number;
    replayKey: number;
    onExitFocus: (node: HTMLLIElement) => void;
    empty?: boolean;
};
const ListRow = forwardRef<HTMLLIElement, ListRowProps>(function ListRow({ item, index, speed, replayKey, onExitFocus, empty = false }, forwardedRef) {
    const nodeRef = useRef<HTMLLIElement | null>(null);
    const present = useIsPresent();
    const reduced = useMotionPreference();
    const controls = useAnimationControls();
    const previousReplay = useRef(replayKey);
    useLayoutEffect(() => {
        const node = nodeRef.current;
        if (!node)
            return;
        if (!present) {
            // Move focus before hiding a retained exit node from the accessibility tree.
            onExitFocus(node);
            node.inert = true;
            node.setAttribute("aria-hidden", "true");
        }
        else {
            node.inert = false;
            node.removeAttribute("aria-hidden");
        }
    }, [present, onExitFocus]);
    useEffect(() => {
        const replayed = previousReplay.current !== replayKey;
        previousReplay.current = replayKey;
        if (!present)
            return;
        if (reduced) {
            controls.stop();
            controls.set({ opacity: 1, y: 0, x: 0 });
            return;
        }
        if (replayed)
            controls.set({ opacity: 0.5, y: 4 });
        void controls.start({
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration: 0.24 / speed,
                delay: replayed ? Math.min(index, 5) * (0.02 / speed) : 0,
                ease: [0.22, 1, 0.36, 1],
            },
        });
    }, [controls, index, present, reduced, replayKey, speed]);
    return (<motion.li ref={(node) => {
            nodeRef.current = node;
            if (typeof forwardedRef === "function")
                forwardedRef(node);
            else if (forwardedRef)
                forwardedRef.current = node;
        }} className={`bal-item${empty ? " bal-empty" : ""}`} data-list-id={empty ? undefined : item.id} data-exiting={present ? undefined : "true"} tabIndex={-1} layout="position" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }} animate={controls} exit={{
            opacity: 0,
            x: reduced ? 0 : -8,
            transition: { duration: reduced ? 0 : 0.16 / speed },
        }} transition={{
            layout: reduced
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 460 * speed * speed,
                    damping: 38 * speed,
                    mass: 1,
                },
        }}>
      {item.content}
    </motion.li>);
});
const initialFiles = [
    { id: "button", name: "button.tsx", code: true },
    { id: "tokens", name: "tokens.css", code: true },
    { id: "readme", name: "README.md", code: false },
];
/** Animate keyed list changes while the host retains ownership of its content. */
function AnimatedList({ items, emptyState = "No items.", ariaLabel = "Items", className = "", style, speed: requestedSpeed = 1, radius = 12, replayKey = 0, preview = false, }: AnimatedListProps) {
    const reduced = useMotionPreference();
    const speed = Number.isFinite(requestedSpeed)
        ? Math.max(0.1, Math.min(4, requestedSpeed))
        : 1;
    const demonstration = preview && items === undefined;
    const [files, setFiles] = useState(initialFiles);
    const [announcement, setAnnouncement] = useState("");
    const [height, setHeight] = useState<number | null>(null);
    const nextFile = useRef(1);
    const listRef = useRef<HTMLUListElement | null>(null);
    const addButton = useRef<HTMLButtonElement | null>(null);
    const [appliedReplay, setAppliedReplay] = useState(replayKey);
    if (appliedReplay !== replayKey) {
        setAppliedReplay(replayKey);
        if (demonstration)
            setFiles((current) => current.length > 1 ? [...current.slice(1), current[0]] : current);
    }
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list)
            return;
        const measure = () => {
            const nextHeight = list.getBoundingClientRect().height;
            setHeight((current) => current !== null && Math.abs(current - nextHeight) < 0.5
                ? current
                : nextHeight);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, []);
    const moveFocusFromExit = useCallback((node: HTMLLIElement) => {
        if (!node.contains(document.activeElement))
            return;
        const list = listRef.current;
        if (!list)
            return;
        const siblings = Array.from(list.children) as HTMLLIElement[];
        const index = siblings.indexOf(node);
        const available = (candidate: HTMLLIElement) => candidate.hasAttribute("data-list-id") &&
            !candidate.hasAttribute("data-exiting");
        const next = siblings.slice(index + 1).find(available) ??
            siblings.slice(0, index).reverse().find(available);
        const target = demonstration
            ? (next?.querySelector<HTMLButtonElement>("[data-list-remove]") ??
                addButton.current)
            : (next ?? list);
        if (target?.getClientRects().length)
            target.focus({ preventScroll: true });
    }, [demonstration]);
    function addFile() {
        if (files.length >= 4)
            return;
        const number = nextFile.current++;
        const name = `draft-${number}.md`;
        setFiles((current) => [
            ...current,
            { id: `draft-${number}`, name, code: false },
        ]);
        setAnnouncement(`${name} added to this preview.`);
    }
    function sortFiles() {
        setFiles((current) => {
            const ordered = [...current].sort((a, b) => a.name.localeCompare(b.name));
            const alreadyAscending = current.every((file, index) => file.id === ordered[index].id);
            return alreadyAscending ? ordered.reverse() : ordered;
        });
        setAnnouncement("File order changed in this preview.");
    }
    const visibleItems: readonly AnimatedListItem[] = demonstration
        ? files.map((file) => {
            const Icon = file.code ? FileCode2 : FileText;
            return {
                id: file.id,
                content: (<div className="bal-file">
              <Icon size={16} strokeWidth={1.6} aria-hidden="true"/>
              <span className="bal-file-name">{file.name}</span>
              <button type="button" className="bal-remove" data-list-remove aria-label={`Remove ${file.name}`} onClick={() => {
                        setFiles((current) => current.filter((item) => item.id !== file.id));
                        setAnnouncement(`${file.name} removed from this preview.`);
                    }}>
                <X size={14} aria-hidden="true"/>
              </button>
            </div>),
            };
        })
        : (items ?? []);
    return (<div className={`bal-root ${className}`} data-preview={preview} style={{
            "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
            ...style,
        } as CSSProperties}>
      {demonstration && (<div className="bal-toolbar" role="group" aria-label="Local file preview controls">
          <button ref={addButton} type="button" className="bal-action" disabled={files.length >= 4} onClick={addFile}>
            <Plus size={14} aria-hidden="true"/> Add file
          </button>
          <button type="button" className="bal-action" disabled={files.length < 2} onClick={sortFiles}>
            Sort
          </button>
          <span className="bal-demo-label">Local preview</span>
        </div>)}
      <motion.div className="bal-frame" initial={false} animate={{ height: height ?? "auto" }} transition={reduced
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 460 * speed * speed,
                damping: 38 * speed,
                mass: 1,
            }}>
        <ul ref={listRef} className="bal-list" role="list" aria-label={demonstration ? "Files in this local preview" : ariaLabel} tabIndex={-1}>
          <AnimatePresence initial={false} mode="popLayout">
            {visibleItems.map((item, index) => (<ListRow key={`item:${item.id}`} item={item} index={index} speed={speed} replayKey={demonstration ? 0 : replayKey} onExitFocus={moveFocusFromExit}/>))}
            {!visibleItems.length && (<ListRow key="empty" item={{ id: "empty", content: emptyState }} index={0} speed={speed} replayKey={demonstration ? 0 : replayKey} onExitFocus={moveFocusFromExit} empty/>)}
          </AnimatePresence>
        </ul>
      </motion.div>
      {demonstration && (<span className="bal-sr-only" role="status" aria-atomic="true">
          {announcement}
        </span>)}
    </div>);
}
export { AnimatedList };

```

Save as `animated-list.css`:

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
.bal-root {
  --bal-ink: var(--foreground, #ededed);
  --bal-muted: var(--muted-foreground, #929292);
  --bal-border: var(--border, #2a2a2a);
  --bal-surface: var(--popover, #151515);
  --bal-background: var(--background, #080808);
  --bal-ring: var(--ring, #bdbdbd);
  width: 100%;
  min-width: 0;
  color: var(--bal-ink);
  font: inherit;
}

.bal-root *,
.bal-root *::before,
.bal-root *::after {
  box-sizing: border-box;
}

.bal-root[data-preview="true"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
  margin-inline: auto;
}

.bal-frame {
  position: relative;
  width: 100%;
  min-width: 0;
}

.bal-list {
  position: relative;
  display: grid;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bal-item {
  position: relative;
  min-width: 0;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: var(--bera-radius, 12px);
  background: var(--bal-background);
}

.bal-item[data-exiting="true"] {
  pointer-events: none;
}

.bal-item:focus,
.bal-list:focus {
  outline: 2px solid var(--bal-ring);
  outline-offset: 3px;
}

.bal-empty {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 10px 12px;
  color: var(--bal-muted);
  font-size: 13px;
  line-height: 1.5;
}

.bal-root[data-preview="true"] .bal-list {
  gap: 2px;
}

.bal-root[data-preview="true"] .bal-item {
  padding: 0 8px;
}

.bal-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.bal-demo-label {
  margin-left: auto;
  color: var(--bal-muted);
  font-size: 12px;
  line-height: 1.4;
}

.bal-action,
.bal-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--bal-ink);
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.bal-action {
  padding: 0 10px;
  border: 1px solid var(--bal-border);
  border-radius: 8px;
  background: var(--bal-surface);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--bal-ink) 5%, transparent);
}

.bal-action:disabled {
  color: var(--bal-muted);
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.bal-file {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 44px;
  font-size: 13px;
  line-height: 1.5;
}

.bal-file > svg {
  flex: none;
  color: var(--bal-muted);
}

.bal-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bal-remove {
  flex: none;
  width: 44px;
  margin-left: auto;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 2px));
  color: var(--bal-muted);
}

.bal-action:focus-visible,
.bal-remove:focus-visible {
  outline: 2px solid var(--bal-ring);
  outline-offset: 3px;
}

@media (hover: hover) {
  .bal-item:hover,
  .bal-item:focus-within {
    border-color: var(--bal-border);
    background: color-mix(in srgb, var(--bal-ink) 3%, var(--bal-background));
  }
  .bal-action:hover:not(:disabled),
  .bal-remove:hover {
    background: color-mix(in srgb, var(--bal-ink) 7%, var(--bal-surface));
    color: var(--bal-ink);
  }
}

.bal-action:active:not(:disabled),
.bal-remove:active {
  background: color-mix(in srgb, var(--bal-ink) 10%, var(--bal-surface));
}

.bal-sr-only {
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

```

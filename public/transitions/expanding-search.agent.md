# Expanding search

Open a search field without leaving your place.

## Choose this for

Compact search or filter controls that need more space on focus.

## Integration

Connect value/onValueChange and optionally open/onOpenChange. Only direct interaction moves focus; external disclosure updates and controlled replay preserve it. onSearch submits the query. Supply actual searchable items or replace demonstration result rendering.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `ExpandingSearch`

Props: items, open, defaultOpen, onOpenChange, value, defaultValue, onValueChange, onSearch, placeholder, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [expanding-search.tsx](https://bera-ui.vercel.app/transitions/expanding-search.tsx)
Styles: [expanding-search.css](https://bera-ui.vercel.app/transitions/expanding-search.css)
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `expanding-search.tsx`:

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
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Search, X } from "lucide-react";
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
import "./expanding-search.css";
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
    const reduced = useMotionPreference();
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
function useKeyboardFocus() {
    const keyboard = useRef(true);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const onPointer = () => {
            keyboard.current = false;
            setVisible(false);
        };
        const onKey = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Tab" || event.key === "Enter" || event.key === " ")
                keyboard.current = true;
        };
        document.addEventListener("pointerdown", onPointer, true);
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("pointerdown", onPointer, true);
            document.removeEventListener("keydown", onKey, true);
        };
    }, []);
    return {
        visible,
        focus: () => setVisible(keyboard.current),
        keyboard: () => {
            keyboard.current = true;
            setVisible(true);
        },
        blur: () => setVisible(false),
    };
}
const defaultSearchItems = ["Button", "Popover", "Tabs", "Search", "Counter"];
type ExpandingSearchProps = PlaybackProps & {
    items?: readonly string[];
    /** Controlled disclosure state. External changes never move focus. */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
};
/** A compact search that filters local items. Escape restores the trigger's focus. */
function ExpandingSearch({ items = defaultSearchItems, open: controlledOpen, defaultOpen, onOpenChange, value, defaultValue = "", onValueChange, onSearch, placeholder = "Find a component…", speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, }: ExpandingSearchProps) {
    const [localValue, setLocalValue] = useState(defaultValue);
    const query = value ?? localValue;
    const [localOpen, setLocalOpen] = useState(defaultOpen ?? Boolean(query));
    const open = controlledOpen ?? localOpen;
    const focus = useKeyboardFocus();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const focusTarget = useRef<"input" | "trigger" | null>(null);
    const [focusRequest, setFocusRequest] = useState(0);
    const previousReplay = useRef(replayKey);
    const [appliedReplay, setAppliedReplay] = useState(replayKey);
    const id = useId();
    const timing = useTiming(speed);
    const trimmed = query.trim();
    const results = items.filter((item) => item.toLowerCase().includes(trimmed.toLowerCase()));
    if (appliedReplay !== replayKey) {
        setAppliedReplay(replayKey);
        if (controlledOpen === undefined)
            setLocalOpen(!open);
    }
    useEffect(() => {
        const replayed = previousReplay.current !== replayKey;
        previousReplay.current = replayKey;
        const target = open && focusTarget.current === "input"
            ? inputRef.current
            : !open && focusTarget.current === "trigger"
                ? triggerRef.current
                : null;
        if (!replayed && target?.getClientRects().length)
            target.focus({ preventScroll: true });
        focusTarget.current = null;
    }, [open, replayKey, focusRequest]);
    const openSearch = () => {
        focusTarget.current = "input";
        setFocusRequest((request) => request + 1);
        if (controlledOpen === undefined)
            setLocalOpen(true);
        onOpenChange?.(true);
    };
    const closeSearch = () => {
        focusTarget.current = "trigger";
        setFocusRequest((request) => request + 1);
        if (controlledOpen === undefined)
            setLocalOpen(false);
        onOpenChange?.(false);
    };
    const change = (next: string) => {
        if (value === undefined)
            setLocalValue(next);
        onValueChange?.(next);
    };
    return (<div data-preview={preview} className={`bs-demo bs-search-demo ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <motion.div className="bs-search-stage" initial={false} animate={{ y: open ? -5 : 0 }} transition={timing.settle}>
        <motion.form className="bs-search-form" data-open={open} data-keyboard-focus={focus.visible} onFocusCapture={focus.focus} onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
                focus.blur();
        }} role="search" aria-label="Search components" initial={false} animate={{
            width: open ? 266 : 116,
        }} transition={timing.settle} onSubmit={(event) => {
            event.preventDefault();
            if (!open)
                openSearch();
            else
                onSearch?.(query);
        }} onKeyDown={(event) => {
            focus.keyboard();
            if (event.key === "Escape" && open) {
                event.preventDefault();
                event.stopPropagation();
                closeSearch();
            }
        }}>
          <motion.button ref={triggerRef} className="bs-search-trigger" style={{ width: open ? 40 : "100%" }} type={open ? "submit" : "button"} aria-label={open ? "Submit search" : "Open search"} aria-expanded={open} aria-controls={`${id}-search-input`} onClick={(event) => {
            if (!open) {
                // The controlled update changes this button to type=submit.
                // Cancel this opening click's default action before that commit.
                event.preventDefault();
                openSearch();
            }
        }} whileTap={timing.reduced ? undefined : { scale: 0.94 }} transition={timing.settle}>
            <motion.span key={replayKey} className="bs-search-icon" initial={{
            rotate: timing.reduced ? 0 : -35,
            opacity: timing.reduced ? 1 : 0,
        }} animate={{ rotate: 0, opacity: 1 }} transition={timing.settle}>
              <Search size={17} strokeWidth={1.8}/>
            </motion.span>
          </motion.button>

          <AnimatePresence initial={false}>
            {!open && (<motion.span className="bs-search-label" aria-hidden="true" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: timing.reduced ? 0 : -5 }} transition={timing.fade}>
                Search
              </motion.span>)}
          </AnimatePresence>

          {open && (<>
              <motion.input ref={inputRef} id={`${id}-search-input`} className="bs-search-input" type="search" aria-label="Search components" aria-describedby={`${id}-search-results`} autoComplete="off" spellCheck={false} value={query} onChange={(event) => change(event.target.value)} placeholder={placeholder} initial={{ opacity: timing.reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={timing.fade}/>
              <motion.button className="bs-search-clear" type="button" aria-label={query ? "Clear search" : "Close search"} onClick={() => {
                if (query) {
                    change("");
                    inputRef.current?.focus({ preventScroll: true });
                }
                else
                    closeSearch();
            }} initial={{ opacity: timing.reduced ? 1 : 0 }} animate={{ opacity: 1 }} whileTap={timing.reduced ? undefined : { scale: 0.88 }} transition={timing.fade}>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span key={query ? "clear" : "close"} className="bs-search-clear-glyph" initial={{
                opacity: 0,
                rotate: timing.reduced ? 0 : -65,
                scale: timing.reduced ? 1 : 0.6,
            }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{
                opacity: 0,
                rotate: timing.reduced ? 0 : 65,
                scale: timing.reduced ? 1 : 0.6,
            }} transition={timing.fade}>
                    {query ? <X size={15}/> : <ArrowLeft size={15}/>}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </>)}
        </motion.form>

        <div className="bs-search-result-space" id={`${id}-search-results`} aria-live="polite" aria-atomic="true">
          {open && trimmed ? (<motion.div className="bs-search-results" key={results.join("|") || "empty"} initial={{
                opacity: timing.reduced ? 1 : 0,
                y: timing.reduced ? 0 : 3,
            }} animate={{ opacity: 1, y: 0 }} transition={timing.fade}>
              <span className="bs-sr-only">{results.length} results.</span>
              {results.length ? (results.slice(0, 3).map((item) => (<span className="bs-search-result" key={item}>
                    <Check size={11}/>
                    {item}
                  </span>))) : (<span className="bs-search-hint">No components found.</span>)}
              {results.length > 3 && (<span className="bs-search-hint">+{results.length - 3}</span>)}
            </motion.div>) : (<span className="bs-search-hint">
              {open
                ? `Search ${items.length} components`
                : "A little room to find things."}
            </span>)}
        </div>
      </motion.div>
    </div>);
}
export { ExpandingSearch };

```

Save as `expanding-search.css`:

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
.bs-demo {
  --bs-text: var(--foreground, #ececec);
  --bs-muted: var(--muted-foreground, #888);
  --bs-surface: var(--popover, #1a1a1a);
  --bs-border: var(--border, #333);
  box-sizing: border-box;
  width: 100%;
  min-height: 230px;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bs-text);
  font-family: inherit;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}

.bs-demo *,
.bs-demo *::before,
.bs-demo *::after {
  box-sizing: border-box;
}
.bs-demo button,
.bs-demo input {
  font: inherit;
}
.bs-demo button {
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.bs-demo button:disabled {
  cursor: default;
}
.bs-demo button:focus-visible,
.bs-tab-panel:focus-visible {
  outline: 2px solid var(--bs-text);
  outline-offset: 4px;
}
.bs-sr-only {
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

.bs-tabs-body {
  width: 320px;
  max-width: 100%;
}
.bs-tablist {
  display: flex;
  gap: 3px;
  width: 100%;
  padding: 4px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bera-radius, 13px);
  background: var(--background, #111);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--bs-text) 3%, transparent);
}
.bs-tab {
  position: relative;
  isolation: isolate;
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 13px) - 4px));
  background: transparent;
  color: var(--bs-muted);
  font-size: 13px !important;
  line-height: 1;
  white-space: nowrap;
  transition: color 150ms;
}
.bs-demo .bs-tab {
  font-weight: 500;
}
.bs-tab:hover {
  color: var(--bs-text);
}
.bs-tab[aria-selected="true"] {
  color: var(--bs-text);
}
.bs-tab-pill {
  position: absolute;
  z-index: -1;
  inset: 0;
  border: 1px solid var(--bs-border);
  border-radius: max(0px, calc(var(--bera-radius, 13px) - 4px));
  background: var(--accent, #282828);
  box-shadow:
    0 1px 2px #0003,
    inset 0 1px 0 color-mix(in srgb, var(--bs-text) 5%, transparent);
}
.bs-tab-label {
  position: relative;
}
.bs-tab-panel {
  min-height: 152px;
  padding: 18px 4px 0;
  border-radius: 6px;
}
.bs-tab-panel[hidden] {
  display: none;
}
.bs-note-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.bs-note {
  display: flex;
  gap: 9px;
  align-items: center;
  min-height: 34px;
}
.bs-note-dot {
  flex: 0 0 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bs-muted) 35%, transparent);
}
.bs-note-dot-unread {
  background: var(--bs-text);
}
.bs-note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--bs-text);
}
.bs-note-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--bs-muted);
  white-space: nowrap;
}
.bs-note-summary {
  margin-top: 12px;
  padding-left: 13px;
  color: var(--bs-muted);
  font-size: 12px;
  line-height: 20px;
}

.bs-search-stage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36px;
}
.bs-search-form {
  position: relative;
  max-width: 100%;
  height: 44px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bera-radius, 12px);
  background: var(--bs-surface);
  box-shadow:
    0 2px 4px #0002,
    inset 0 1px 0 color-mix(in srgb, var(--bs-text) 4%, transparent);
}
.bs-search-form[data-open="true"] {
  border-color: color-mix(in srgb, var(--bs-border) 70%, var(--bs-text));
}
.bs-search-form[data-keyboard-focus="true"] {
  outline: 1px solid var(--bs-muted);
  outline-offset: 3px;
}
.bs-demo .bs-search-input:focus-visible {
  outline: none;
  box-shadow: none;
}
.bs-search-trigger {
  position: absolute;
  top: 0;
  left: 0;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 4px));
  background: transparent;
  color: var(--bs-text);
}
.bs-search-trigger:hover {
  color: var(--bs-text);
}
.bs-search-icon {
  position: absolute;
  left: 13px;
  top: 12px;
  display: flex;
}
.bs-search-label {
  position: absolute;
  top: 13px;
  left: 40px;
  line-height: 16px;
  pointer-events: none;
}
.bs-search-input {
  position: absolute;
  top: 0;
  left: 40px;
  width: calc(100% - 80px);
  min-width: 0;
  height: 42px;
  padding: 0;
  outline: 0;
  border: 0;
  background: transparent;
  color: var(--bs-text);
  font-size: 13px !important;
  caret-color: var(--bs-text);
}
.bs-search-input::placeholder {
  color: var(--bs-muted);
}
.bs-search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.bs-search-clear {
  position: absolute;
  top: 3px;
  right: 3px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: max(0px, calc(var(--bera-radius, 12px) - 4px));
  color: var(--bs-muted);
  background: transparent;
  transition:
    color 150ms,
    background 150ms;
}
.bs-search-clear:hover {
  color: var(--bs-text);
  background: color-mix(in srgb, var(--bs-text) 4%, transparent);
}
.bs-search-clear-glyph {
  display: grid;
  place-items: center;
}
.bs-search-result-space {
  width: 100%;
  min-height: 45px;
  padding-top: 16px;
  text-align: center;
}
.bs-search-hint {
  color: var(--bs-muted);
  font-size: 12px;
  line-height: 20px;
}
.bs-search-results {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}
.bs-search-result {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border: 1px solid var(--bs-border);
  border-radius: 5px;
  color: var(--bs-text);
  font-size: 12px;
  line-height: 20px;
}
.bs-search-result svg {
  color: var(--bs-muted);
}

.bs-counter-demo {
  flex-direction: column;
  gap: 16px;
}
.bs-counter-label {
  color: var(--bs-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}
.bs-counter-control {
  display: flex;
  align-items: center;
  gap: 20px;
}
.bs-counter-button {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--bs-border);
  border-radius: 50%;
  color: var(--bs-text);
  background: var(--bs-surface);
  box-shadow:
    0 1px 2px #0002,
    inset 0 1px 0 color-mix(in srgb, var(--bs-text) 4%, transparent);
  transition:
    color 150ms,
    border-color 150ms,
    background 150ms,
    opacity 150ms;
}
.bs-counter-button:hover:not(:disabled) {
  color: var(--bs-text);
  background: var(--accent, #232323);
  border-color: var(--bs-border);
}
.bs-counter-button:disabled {
  opacity: 0.4;
}
.bs-counter-value {
  position: relative;
}
.bs-counter-digits {
  display: flex;
  font-size: 48px;
  line-height: 1;
  font-weight: 450;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}
.bs-digit-place {
  width: 30px;
  transition: color 180ms;
}
.bs-digit-muted {
  color: color-mix(in srgb, var(--bs-text) 22%, var(--background, #111));
}
.bs-digit-window {
  display: block;
  height: 58px;
  overflow: hidden;
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.bs-digit-strip {
  display: flex;
  flex-direction: column;
  height: 2900px;
  will-change: transform;
}
.bs-digit {
  flex: 0 0 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bs-counter-hint {
  margin-top: 0;
  color: var(--bs-muted);
  font-size: 12px;
  line-height: 20px;
}

@media (prefers-reduced-motion: reduce) {
  .bs-demo *,
  .bs-demo *::before,
  .bs-demo *::after {
    transition-duration: 0s !important;
  }
}

@media (pointer: coarse) {
  .bs-search-input {
    font-size: 16px !important;
  }
}

/* Application imports use the natural component size. */
.bs-demo[data-preview="false"] {
  min-height: 0;
  padding: 0;
  max-width: 100%;
  width: fit-content;
}
.bs-demo[data-preview="false"] .bs-search-stage {
  padding-top: 0;
}
.bs-demo[data-preview="false"] .bs-counter-hint {
  display: none;
}

```

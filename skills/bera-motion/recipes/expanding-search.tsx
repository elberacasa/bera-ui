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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Search, X } from "lucide-react";
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
    const reduced = useReducedMotion();
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

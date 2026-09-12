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
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { LayoutGroup, motion, useAnimationControls, useReducedMotion } from "motion/react";
import "./sliding-tabs.css";
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
type SlidingTab = {
    value: string;
    label: string;
    content: ReactNode;
};
type SlidingTabsProps = PlaybackProps & {
    items?: readonly SlidingTab[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    ariaLabel?: string;
};
const notes = [
    { title: "Refine the details", time: "Just now", unread: true, saved: true },
    { title: "Keep it simple", time: "2 hours ago", unread: false, saved: true },
    {
        title: "Make room for focus",
        time: "Yesterday",
        unread: false,
        saved: false,
    },
];
function NoteList({ filter }: {
    filter: "all" | "unread" | "saved";
}) {
    const visible = notes.filter((note) => filter === "all" || note[filter]);
    return (<div className="bs-note-list">
      {visible.map((note) => (<div className="bs-note" key={note.title}>
          <span className={`bs-note-dot${note.unread ? " bs-note-dot-unread" : ""}`}/>
          <span className="bs-note-title">{note.title}</span>
          <span className="bs-note-time">{note.time}</span>
        </div>))}
      <span className="bs-note-summary">
        {visible.length} {visible.length === 1 ? "note" : "notes"}
      </span>
    </div>);
}
const defaultTabs: readonly SlidingTab[] = [
    { value: "all", label: "All notes", content: <NoteList filter="all"/> },
    { value: "unread", label: "Unread", content: <NoteList filter="unread"/> },
    { value: "saved", label: "Saved", content: <NoteList filter="saved"/> },
];
/** Automatic-activation tabs: arrows wrap, Home/End jump, and Tab enters the panel. */
function SlidingTabs({ items = defaultTabs, value, defaultValue, onValueChange, ariaLabel = "Filter notes", speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, }: SlidingTabsProps) {
    const [localValue, setLocalValue] = useState(defaultValue ?? items[0]?.value ?? "");
    const selected = value ?? localValue;
    const active = items.find((item) => item.value === selected) ?? items[0];
    const id = useId();
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const timing = useTiming(speed);
    const entrance = useAnimationControls();
    const previousReplay = useRef(replayKey);
    const [appliedReplay, setAppliedReplay] = useState(replayKey);
    if (appliedReplay !== replayKey) {
        setAppliedReplay(replayKey);
        if (value === undefined && items.length) {
            const index = items.findIndex((item) => item.value === active?.value);
            setLocalValue(items[(index + 1) % items.length].value);
        }
    }
    useEffect(() => {
        void entrance.start({ opacity: 1, y: 0, transition: timing.entrance });
    }, [entrance, timing.entrance]);
    useEffect(() => {
        if (previousReplay.current === replayKey)
            return;
        previousReplay.current = replayKey;
        if (value !== undefined) {
            // Animate the existing node: controlled panel content and focus survive replay.
            entrance.set({
                opacity: timing.reduced ? 1 : 0.35,
                y: timing.reduced ? 0 : 5,
            });
            void entrance.start({ opacity: 1, y: 0, transition: timing.entrance });
        }
    }, [replayKey, value, entrance, timing.entrance, timing.reduced]);
    const select = (next: string) => {
        if (next === active?.value)
            return;
        if (value === undefined)
            setLocalValue(next);
        onValueChange?.(next);
    };
    const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = index;
        if (event.key === "ArrowRight")
            next = (index + 1) % items.length;
        else if (event.key === "ArrowLeft")
            next = (index - 1 + items.length) % items.length;
        else if (event.key === "Home")
            next = 0;
        else if (event.key === "End")
            next = items.length - 1;
        else
            return;
        event.preventDefault();
        select(items[next].value);
        refs.current[next]?.focus();
    };
    if (!active)
        return null;
    return (<div data-preview={preview} className={`bs-demo bs-tabs-demo ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <LayoutGroup id={id}>
        <motion.div className="bs-tabs-body" initial={{
            opacity: timing.reduced ? 1 : 0,
            y: timing.reduced ? 0 : 5,
        }} animate={entrance} transition={timing.entrance}>
          <div className="bs-tablist" role="tablist" aria-label={ariaLabel}>
            {items.map((item, index) => {
            const isActive = item.value === active.value;
            return (<motion.button key={item.value} ref={(node) => {
                    refs.current[index] = node;
                }} className="bs-tab" type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={isActive} aria-controls={`${id}-panel-${index}`} tabIndex={isActive ? 0 : -1} onClick={() => select(item.value)} onKeyDown={(event) => navigate(event, index)} whileTap={timing.reduced ? undefined : { scale: 0.96 }} transition={timing.settle}>
                  {isActive && (<motion.span className="bs-tab-pill" layoutId="active-tab" transition={timing.settle}/>)}
                  <span className="bs-tab-label">{item.label}</span>
                </motion.button>);
        })}
          </div>
          {items.map((item, index) => (<div key={item.value} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} hidden={item.value !== active.value} className="bs-tab-panel">
              {item.value === active.value && (<motion.div key={item.value} initial={{
                    opacity: timing.reduced ? 1 : 0,
                    y: timing.reduced ? 0 : 3,
                }} animate={{ opacity: 1, y: 0 }} transition={timing.fade}>
                  {item.content}
                </motion.div>)}
            </div>))}
        </motion.div>
      </LayoutGroup>
    </div>);
}
export { SlidingTabs };

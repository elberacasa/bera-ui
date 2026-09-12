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
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Copy, MoreHorizontal, Pin, RotateCcw, X } from "lucide-react";
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
import "./morphing-menu.css";
interface SurfaceMotionProps {
    preview?: boolean;
    radius?: number;
    className?: string;
    style?: CSSProperties;
    /** Playback rate: 1 is normal; .35 is slow motion. */
    speed?: number;
    /** Change this value to exercise the next transition. */
    replayKey?: number;
}
interface MorphingMenuAction {
    label: string;
    /** Render an icon, for example <Copy size={15} />. */
    icon?: ReactNode;
    onSelect: () => void;
    /** Supplying a boolean makes this action an accessible checked menu item. */
    checked?: boolean;
}
interface MorphingMenuProps extends SurfaceMotionProps {
    label?: string;
    actions?: readonly MorphingMenuAction[];
}
function useSurfaceMotion(speed: number) {
    const reduced = useMotionPreference();
    const rate = Number.isFinite(speed) ? Math.max(0.15, speed) : 1;
    return {
        reduced,
        rate,
        spring: reduced
            ? { duration: 0 }
            : {
                type: "spring" as const,
                stiffness: 470 * rate * rate,
                damping: 34 * rate,
                mass: 0.9,
            },
        fade: (duration = 0.14, delay = 0) => ({
            duration: reduced ? 0 : duration / rate,
            delay: reduced ? 0 : delay / rate,
            ease: "easeOut" as const,
        }),
    };
}
/**
 * One physical surface expands around its fixed bottom-right corner.
 * Width/height animate directly; the content never inherits a scale transform.
 * Arrow keys navigate; Escape restores focus; Tab leaves the menu normally.
 */
function MorphingMenu({ speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, label = "Actions", actions: suppliedActions, }: MorphingMenuProps) {
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [activeItem, setActiveItem] = useState(0);
    const frameRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const focusOnOpen = useRef(false);
    const firstItem = useRef(0);
    const previousReplay = useRef(replayKey);
    const focusFrame = useRef<number | null>(null);
    const menuId = useId();
    const { reduced, rate, spring, fade } = useSurfaceMotion(speed);
    function closeMenu(restoreFocus = true) {
        // Remove departing items from navigation immediately, before Tab's default action.
        if (contentRef.current)
            contentRef.current.inert = true;
        setOpen(false);
        if (restoreFocus)
            triggerRef.current?.focus({ preventScroll: true });
    }
    function focusItem(index: number) {
        setActiveItem(index);
        itemsRef.current[index]?.focus({ preventScroll: true });
    }
    useEffect(() => {
        if (previousReplay.current === replayKey)
            return;
        previousReplay.current = replayKey;
        focusOnOpen.current = false;
        setOpen((current) => !current);
    }, [replayKey]);
    useEffect(() => {
        if (!open)
            return;
        if (focusOnOpen.current) {
            focusOnOpen.current = false;
            focusFrame.current = requestAnimationFrame(() => {
                setActiveItem(firstItem.current);
                itemsRef.current[firstItem.current]?.focus({ preventScroll: true });
            });
        }
        const dismissOutside = (event: PointerEvent) => {
            if (event.target instanceof Node &&
                !frameRef.current?.contains(event.target))
                setOpen(false);
        };
        document.addEventListener("pointerdown", dismissOutside);
        return () => {
            if (focusFrame.current !== null)
                cancelAnimationFrame(focusFrame.current);
            document.removeEventListener("pointerdown", dismissOutside);
        };
    }, [open]);
    function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
        }
        else if (event.key === "Tab") {
            // Move the tab starting point back to the trigger before normal navigation.
            closeMenu();
        }
        else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!actions.length)
                return;
            const next = event.key === "Home"
                ? 0
                : event.key === "End"
                    ? actions.length - 1
                    : (activeItem +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        actions.length) %
                        actions.length;
            focusItem(next);
        }
    }
    async function copyLabel() {
        try {
            await navigator.clipboard.writeText("MorphingMenu");
            setFeedback("Component name copied");
        }
        catch {
            setFeedback("Clipboard unavailable in this browser");
        }
    }
    const actions: readonly MorphingMenuAction[] = suppliedActions ?? [
        {
            label: "Copy component name",
            icon: <Copy size={15}/>,
            onSelect: copyLabel,
        },
        {
            label: pinned ? "Unpin preview" : "Pin preview",
            icon: <Pin size={15}/>,
            checked: pinned,
            onSelect: () => {
                setPinned((current) => !current);
                setFeedback(pinned ? "Preview unpinned" : "Preview pinned");
            },
        },
        {
            label: "Reset preview",
            icon: <RotateCcw size={15}/>,
            onSelect: () => {
                setPinned(false);
                setFeedback("Preview reset");
            },
        },
    ];
    const menuLabel = label === "Actions" ? "Quick actions" : label;
    return (<div data-preview={preview} className={`bt-surface-demo bt-morph-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      {pinned ? (<span className="bt-pin-indicator">
          <Pin size={12} aria-hidden="true"/> Pinned
        </span>) : null}
      <motion.div ref={frameRef} className="bt-morph-surface" initial={false} animate={{
            width: open ? 238 : 122,
            height: open ? 53 + Math.min(actions.length, 3) * 45 : 44,
            borderRadius: Math.max(0, Math.min(24, radius)),
        }} transition={spring} onBlur={(event) => {
            if (open &&
                event.relatedTarget instanceof Node &&
                !event.currentTarget.contains(event.relatedTarget))
                closeMenu(false);
        }}>
        <motion.button ref={triggerRef} type="button" className="bt-morph-trigger" aria-label={menuLabel} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} disabled={actions.length === 0} tabIndex={open ? -1 : 0} initial={false} animate={{ opacity: open ? 0 : 1, y: reduced ? 0 : open ? 5 : 0 }} transition={fade(open ? 0.07 : 0.12, open ? 0 : 0.08)} style={{ pointerEvents: open ? "none" : "auto" }} onClick={() => {
            focusOnOpen.current = true;
            firstItem.current = 0;
            setOpen((current) => !current);
        }} onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                focusOnOpen.current = true;
                firstItem.current =
                    event.key === "ArrowUp" ? actions.length - 1 : 0;
                setOpen(true);
            }
        }}>
          <MoreHorizontal size={17} aria-hidden="true"/>
          <span>{label}</span>
        </motion.button>
        <motion.div ref={contentRef} className="bt-morph-content" aria-hidden={!open} inert={!open} initial={false} animate={{ opacity: open ? 1 : 0 }} transition={fade(open ? 0.1 : 0.06, open ? 0.06 : 0)} style={{ pointerEvents: open ? "auto" : "none" }} onKeyDown={handleMenuKey}>
          <div className="bt-menu-heading">
            <span>{menuLabel}</span>
            <button type="button" className="bt-menu-close" aria-label={`Close ${menuLabel}`} tabIndex={-1} onClick={() => closeMenu()}>
              <X size={14} aria-hidden="true"/>
            </button>
          </div>
          <div id={menuId} role="menu" aria-label={menuLabel} className="bt-menu-items">
            {actions.map(({ label: actionLabel, icon, onSelect, checked }, index) => (<motion.button key={index} ref={(element) => {
                itemsRef.current[index] = element;
            }} type="button" role={checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={checked} tabIndex={open && activeItem === index ? 0 : -1} className="bt-menu-item" initial={false} animate={{
                opacity: open ? 1 : 0,
                y: reduced || open ? 0 : 7,
            }} transition={{
                ...spring,
                opacity: fade(open ? 0.13 : 0.05, open ? 0.075 + index * 0.028 : 0),
                delay: reduced || !open ? 0 : (0.065 + index * 0.025) / rate,
            }} onFocus={() => setActiveItem(index)} onClick={() => {
                closeMenu();
                onSelect();
            }}>
                  {icon ? (<span className="bt-menu-action-icon" aria-hidden="true">
                      {icon}
                    </span>) : null}
                  <span>{actionLabel}</span>
                  {checked ? (<Check size={13} className="bt-menu-checked" aria-hidden="true"/>) : null}
                </motion.button>))}
          </div>
        </motion.div>
      </motion.div>
      <span className="bt-demo-feedback" role="status" aria-live="polite">
        {feedback}
      </span>
    </div>);
}
export { MorphingMenu };

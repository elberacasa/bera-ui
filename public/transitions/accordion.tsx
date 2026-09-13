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
import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
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
import "./accordion.css";
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
const accordionItems = [
    {
        title: "Project overview",
        body: "Website refresh, shared components, and documentation.",
    },
    {
        title: "Project files",
        body: "The brief, design files, and implementation notes are kept together.",
    },
    {
        title: "Release notes",
        body: "Review the changes and resolved issues included in the latest version.",
    },
];
interface AccordionItem {
    title: string;
    body: ReactNode;
}
interface AccordionProps extends SurfaceMotionProps {
    items?: readonly AccordionItem[];
    /** The open item index, or null for all closed. */
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
}
/** Intrinsic content height keeps text unscaled, including during reversals. */
function Accordion({ speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, items = accordionItems, value, defaultValue = 0, onValueChange, }: AccordionProps) {
    const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
    const expanded = value === undefined ? internalValue : value;
    const [previousReplay, setPreviousReplay] = useState(replayKey);
    const id = useId();
    const { reduced, spring, fade } = useSurfaceMotion(speed);
    // Gallery replay only adjusts local state. Controlled values belong to the caller.
    if (previousReplay !== replayKey) {
        setPreviousReplay(replayKey);
        if (value === undefined) {
            setInternalValue(items.length === 0
                ? null
                : internalValue === null
                    ? 0
                    : (internalValue + 1) % items.length);
        }
    }
    return (<div data-preview={preview} className={`bt-surface-demo bt-accordion-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bt-accordion">
        {items.map((item, index) => {
            const isOpen = expanded === index;
            const triggerId = `${id}-trigger-${index}`;
            const panelId = `${id}-panel-${index}`;
            return (<div className="bt-accordion-item" key={item.title} data-open={isOpen}>
              <h3 className="bt-accordion-heading">
                <button id={triggerId} type="button" className="bt-accordion-trigger" aria-expanded={isOpen} aria-controls={panelId} onClick={() => {
                    const next = expanded === index ? null : index;
                    if (value === undefined)
                        setInternalValue(next);
                    onValueChange?.(next);
                }}>
                  <span>{item.title}</span>
                  <motion.span className="bt-disclosure" initial={false} animate={{ rotate: isOpen ? 180 : 0 }} transition={spring}>
                    <ChevronDown size={15} aria-hidden="true"/>
                  </motion.span>
                </button>
              </h3>
              <motion.div id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!isOpen} inert={!isOpen} className="bt-accordion-panel" initial={false} animate={{ height: isOpen ? "auto" : 0 }} transition={spring}>
                <motion.div className="bt-accordion-body" initial={false} animate={{
                    opacity: isOpen ? 1 : 0,
                    y: reduced ? 0 : isOpen ? 0 : -5,
                }} transition={{
                    ...spring,
                    opacity: fade(isOpen ? 0.18 : 0.1, isOpen ? 0.045 : 0),
                }}>
                  {item.body}
                </motion.div>
              </motion.div>
            </div>);
        })}
      </div>
    </div>);
}
export { Accordion };

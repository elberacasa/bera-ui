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
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, Plus, X } from "lucide-react";
import "./toast-stack.css";
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
    const reduced = useReducedMotion();
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
type PreviewToast = {
    id: number;
    title: string;
    description: ReactNode;
};
interface ToastStackProps extends SurfaceMotionProps {
    /** New notifications capture these values when added, preserving older content. */
    title?: string;
    description?: ReactNode;
}
/** Local preview notifications. The newest is on top; dismiss reveals the next. */
function ToastStack({ speed = 1, radius = 12, preview = false, className = "", style, replayKey = 0, title = "Preview notification", description = "Created locally in this demo.", }: ToastStackProps) {
    const [toasts, setToasts] = useState<PreviewToast[]>(() => [
        { id: 1, title, description },
    ]);
    const [announcement, setAnnouncement] = useState("");
    const counter = useRef(1);
    const previousReplay = useRef(replayKey);
    const previewButton = useRef<HTMLButtonElement>(null);
    const dismissButtons = useRef(new Map<number, HTMLButtonElement>());
    const focusFrame = useRef<number | null>(null);
    const { reduced, spring, fade } = useSurfaceMotion(speed);
    function addToast() {
        const id = ++counter.current;
        setToasts((current) => [{ id, title, description }, ...current].slice(0, 3));
        setAnnouncement(`Notification ${id}: ${title}.`);
    }
    function dismissToast(id: number) {
        const wasFocused = document.activeElement === dismissButtons.current.get(id);
        const remaining = toasts.filter((toast) => toast.id !== id);
        setToasts(remaining);
        setAnnouncement(remaining.length
            ? `Notification dismissed. ${remaining.length} remaining.`
            : "All preview notifications dismissed.");
        if (wasFocused) {
            if (focusFrame.current !== null)
                cancelAnimationFrame(focusFrame.current);
            focusFrame.current = requestAnimationFrame(() => {
                const nextButton = remaining[0]
                    ? dismissButtons.current.get(remaining[0].id)
                    : null;
                (nextButton ?? previewButton.current)?.focus({ preventScroll: true });
            });
        }
    }
    useEffect(() => {
        if (previousReplay.current === replayKey)
            return;
        previousReplay.current = replayKey;
        const id = ++counter.current;
        setToasts((current) => [{ id, title, description }, ...current].slice(0, 3));
        setAnnouncement(`Notification ${id}: ${title}.`);
    }, [replayKey, title, description]);
    useEffect(() => () => {
        if (focusFrame.current !== null)
            cancelAnimationFrame(focusFrame.current);
    }, []);
    return (<div data-preview={preview} className={`bt-surface-demo bt-toast-preview ${className}`} style={{
            "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
            ...style,
        } as CSSProperties}>
      <div className="bt-toast-position">
        <AnimatePresence initial={false}>
          {!toasts.length ? (<motion.div key="empty" className="bt-toast-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade()}>
              <Bell size={19} aria-hidden="true"/>
              <span>No notifications</span>
            </motion.div>) : null}
        </AnimatePresence>
        <ol className="bt-toast-list" aria-label="Preview notifications">
          <AnimatePresence initial={false}>
            {toasts.map((toast, index) => (<motion.li key={toast.id} className="bt-toast" aria-hidden={index > 0} inert={index > 0} initial={{
                opacity: 0,
                y: reduced ? 0 : 25,
                scale: reduced ? 1 : 0.98,
            }} animate={{
                opacity: 1 - index * 0.17,
                y: index * -11,
                scale: 1 - index * 0.045,
                x: 0,
            }} exit={{
                opacity: 0,
                x: reduced ? 0 : 38,
                transition: fade(0.15),
            }} transition={{ ...spring, opacity: fade(0.16) }} style={{
                zIndex: 3 - index,
                pointerEvents: index === 0 ? "auto" : "none",
                transformOrigin: "50% 0%",
            }}>
                <span className="bt-toast-icon">
                  <Bell size={15} aria-hidden="true"/>
                </span>
                <div className="bt-toast-copy">
                  <span className="bt-toast-title">
                    {toast.title}{" "}
                    {toast.title === "Preview notification" ? (<span className="bt-toast-number">{toast.id}</span>) : null}
                  </span>
                  <span className="bt-toast-description">
                    {toast.description}
                  </span>
                </div>
                <button ref={(element) => {
                if (element)
                    dismissButtons.current.set(toast.id, element);
                else
                    dismissButtons.current.delete(toast.id);
            }} type="button" className="bt-toast-dismiss" aria-label={`Dismiss ${toast.title} ${toast.id}`} tabIndex={index === 0 ? 0 : -1} onClick={() => dismissToast(toast.id)}>
                  <X size={14} aria-hidden="true"/>
                </button>
              </motion.li>))}
          </AnimatePresence>
        </ol>
      </div>
      <motion.button ref={previewButton} type="button" className="bt-toast-add" whileTap={reduced ? undefined : { y: 1, scale: 0.98 }} transition={spring} onClick={addToast}>
        <Plus size={15} aria-hidden="true"/>
        Preview toast
      </motion.button>
      <span className="bt-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>);
}
export { ToastStack };

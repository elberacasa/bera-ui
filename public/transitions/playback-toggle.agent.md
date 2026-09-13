# Play / pause

One shape, two states. Continuous in both directions.

## Choose this for

Play and pause controls for video, audio, or user-controlled animation.

## Integration

Connect playing to the actual media or animation state, and onPlayingChange to a playback request. Update state from real play, pause, and ended events; handle rejected play promises in the host. The button does not operate media itself. Supply accessible Play/Pause labels and keep native keyboard behavior. The optional local preview is a finite animation, not an audio or video player. Replay changes only the icon, never playback state or callbacks.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `PlaybackToggle`

Props: playing, defaultPlaying, onPlayingChange, labels, disabled, buttonRef, native button attributes, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: [playback-toggle.tsx](https://bera-ui.vercel.app/transitions/playback-toggle.tsx)
Styles: [playback-toggle.css](https://bera-ui.vercel.app/transitions/playback-toggle.css)
Dependencies: React, motion. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.

## Complete source

Save as `playback-toggle.tsx`:

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
import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, Ref } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
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
import "./playback-toggle.css";
interface PlaybackToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type" | "aria-label" | "aria-pressed" | "defaultValue"> {
    /** Connect to actual media state; requests do not optimistically change it. */
    playing?: boolean;
    defaultPlaying?: boolean;
    onPlayingChange?: (playing: boolean) => void;
    labels?: {
        play: string;
        pause: string;
    };
    buttonRef?: Ref<HTMLButtonElement>;
    /** Opt in to an eight-second local animation, with no autoplay or media. */
    preview?: boolean;
    speed?: number;
    radius?: number;
    /** Replays only the shape; never changes playback, invokes callbacks, or focuses. */
    replayKey?: number;
}
// Two filled pieces share M/L/Q/L/Q/L/Q/L/Q/Z commands. Their play edges
// overlap by .04 units to avoid an antialiasing seam; pause has two equal bars.
const LEFT_SHAPE = [
    "M8.85 5.75L12.02 7.62Q12.02 7.62 12.02 7.62L12.02 16.38Q12.02 16.38 12.02 16.38L8.85 18.25Q8 18.75 8 17.75L8 6.25Q8 5.25 8.85 5.75Z",
    "M7.75 6L9.25 6Q10 6 10 6.75L10 17.25Q10 18 9.25 18L7.75 18Q7 18 7 17.25L7 6.75Q7 6 7.75 6Z",
];
const RIGHT_SHAPE = [
    "M11.98 7.60L18.40 11.39Q19.44 12 18.40 12.61L11.98 16.40Q11.98 16.40 11.98 16.40L11.98 12Q11.98 12 11.98 12L11.98 7.60Q11.98 7.60 11.98 7.60Z",
    "M14.75 6L16.25 6Q17 6 17 6.75L17 17.25Q17 18 16.25 18L14.75 18Q14 18 14 17.25L14 6.75Q14 6 14.75 6Z",
];
const DEFAULT_LABELS = { play: "Play", pause: "Pause" };
const PREVIEW_DURATION = 8;
type ControlProps = Omit<PlaybackToggleProps, "preview">;
function PlaybackControl({ playing, defaultPlaying = false, onPlayingChange, labels = DEFAULT_LABELS, buttonRef, speed = 1, radius = 12, replayKey = 0, disabled = false, className = "", style, title, onClick, ...buttonProps }: ControlProps) {
    const [localPlaying, setLocalPlaying] = useState(defaultPlaying);
    const localValue = useRef(defaultPlaying);
    const active = playing ?? localPlaying;
    const reduced = useMotionPreference();
    const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
    const progress = useMotionValue(active ? 1 : 0);
    const previousReplay = useRef(replayKey);
    const left = useTransform(progress, [0, 1], LEFT_SHAPE);
    const right = useTransform(progress, [0, 1], RIGHT_SHAPE);
    useEffect(() => {
        const replay = previousReplay.current !== replayKey;
        previousReplay.current = replayKey;
        const target = active ? 1 : 0;
        if (reduced) {
            progress.jump(target);
            return;
        }
        const spring = {
            type: "spring" as const,
            stiffness: 420 * rate * rate,
            damping: 36 * rate,
            mass: 0.9,
            restDelta: 0.001,
            restSpeed: 0.01,
        };
        let cancelled = false;
        // Retarget the shared value from its current geometry and velocity.
        let playback = animate(progress, replay && !disabled ? 1 - target : target, spring);
        if (replay && !disabled) {
            void playback.then(() => {
                if (!cancelled)
                    playback = animate(progress, target, spring);
            });
        }
        return () => {
            cancelled = true;
            playback.stop();
        };
    }, [active, disabled, progress, rate, reduced, replayKey]);
    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        onClick?.(event);
        if (event.defaultPrevented || disabled)
            return;
        const next = !(playing ?? localValue.current);
        if (playing === undefined) {
            localValue.current = next;
            setLocalPlaying(next);
        }
        onPlayingChange?.(next);
    }
    const action = (active ? labels.pause : labels.play).trim() ||
        (active ? DEFAULT_LABELS.pause : DEFAULT_LABELS.play);
    return (<button {...buttonProps} ref={buttonRef} type="button" className={`bpt-button ${className}`} style={{
            "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
            ...style,
        } as CSSProperties} aria-label={action} aria-pressed={undefined} data-playing={active} disabled={disabled} title={title ?? action} onClick={handleClick}>
      <svg className="bpt-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <motion.path data-playback-path="left" d={left}/>
        <motion.path data-playback-path="right" d={right}/>
      </svg>
    </button>);
}
function AnimationPreview({ onPlayingChange, ...props }: ControlProps) {
    const [playing, setPlaying] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [announcement, setAnnouncement] = useState("");
    const root = useRef<HTMLDivElement>(null);
    const clock = useMotionValue(0);
    const reduced = useMotionPreference();
    const progress = useTransform(clock, (value) => (reduced ? Math.floor(value) : value) / PREVIEW_DURATION);
    const wholeSecond = useRef(0);
    const timer = useRef<ReturnType<typeof animate> | null>(null);
    useMotionValueEvent(clock, "change", (value) => {
        const second = Math.floor(value);
        if (second !== wholeSecond.current) {
            wholeSecond.current = second;
            setSeconds(second);
        }
    });
    useEffect(() => {
        if (!playing)
            return;
        let cancelled = false;
        const playback = animate(clock, PREVIEW_DURATION, {
            duration: PREVIEW_DURATION - clock.get(),
            ease: "linear",
        });
        timer.current = playback;
        void playback.then(() => {
            if (cancelled)
                return;
            setPlaying(false);
            setAnnouncement("Animation preview complete.");
        });
        return () => {
            cancelled = true;
            playback.stop();
            timer.current = null;
        };
    }, [clock, playing]);
    useEffect(() => {
        const node = root.current;
        if (!node)
            return;
        const pause = () => {
            timer.current?.stop();
            setPlaying(false);
        };
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting)
                pause();
        });
        const onVisibility = () => {
            if (document.visibilityState === "hidden")
                pause();
        };
        observer.observe(node);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);
    function changePlaying(next: boolean) {
        if (next && clock.get() >= PREVIEW_DURATION)
            clock.jump(0);
        setPlaying(next);
        setAnnouncement("");
        onPlayingChange?.(next);
    }
    return (<div className="bpt-preview" ref={root} data-preview="true">
      <PlaybackControl {...props} playing={playing} onPlayingChange={changePlaying}/>
      <div className="bpt-preview-detail">
        <span className="bpt-preview-label">Animation preview</span>
        <span className="bpt-time" role="timer" aria-label="Preview elapsed time">
          0:{String(seconds).padStart(2, "0")} <span>/ 0:08</span>
        </span>
        <div className="bpt-track" aria-hidden="true">
          <motion.div className="bpt-progress" style={{ scaleX: progress }}/>
        </div>
      </div>
      <span className="bpt-sr-only" role="status" aria-atomic="true">
        {announcement}
      </span>
    </div>);
}
/** A play/pause action. Connect controlled state to the host's real playback events. */
function PlaybackToggle({ preview = false, ...props }: PlaybackToggleProps) {
    if (preview && props.playing === undefined)
        return <AnimationPreview {...props}/>;
    const button = <PlaybackControl {...props}/>;
    if (!preview)
        return button;
    return (<div className="bpt-preview" data-preview="true">
      {button}
      <div className="bpt-preview-detail">
        <span className="bpt-preview-label">Playback control</span>
        <span className="bpt-host-caption">Host playback state</span>
      </div>
    </div>);
}
export { PlaybackToggle };

```

Save as `playback-toggle.css`:

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
.bpt-button {
  --bpt-ink: var(--foreground, #ededed);
  --bpt-surface: var(--background, #111);
  --bpt-border: var(--border, #303030);
  --bpt-hover: var(--accent, #222);
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  box-sizing: border-box;
  width: var(--bera-icon-button-size, 48px);
  height: var(--bera-icon-button-size, 48px);
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 1px solid var(--bpt-border);
  border-radius: var(--bera-radius, 12px);
  color: var(--bpt-ink);
  background: color-mix(in srgb, var(--bpt-surface) 97%, var(--bpt-ink));
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--bpt-ink) 7%, transparent) inset,
    0 2px 4px #0000001a;
  font: inherit;
  vertical-align: middle;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 140ms ease,
    border-color 140ms ease;
}
.bpt-icon {
  display: block;
  width: var(--bera-icon-size, 26px);
  height: var(--bera-icon-size, 26px);
  pointer-events: none;
}
@media (hover: hover) {
  .bpt-button:hover:not(:disabled) {
    background: var(--bpt-hover);
    border-color: color-mix(in srgb, var(--bpt-border) 75%, var(--bpt-ink));
  }
}
.bpt-button:active:not(:disabled) {
  background: color-mix(in srgb, var(--bpt-ink) 12%, var(--bpt-surface));
  box-shadow: 0 1px 2px #00000024 inset;
}
.bpt-button:focus-visible {
  outline: 2px solid var(--ring, var(--bpt-ink));
  outline-offset: 4px;
}
.bpt-button:disabled {
  opacity: 0.42;
  cursor: default;
  box-shadow: none;
}
.bpt-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 320px;
  min-width: 0;
  margin-inline: auto;
  color: var(--foreground, #ededed);
  font: inherit;
}
.bpt-preview-detail {
  display: grid;
  flex: 1;
  gap: 5px;
  min-width: 0;
}
.bpt-preview-label {
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.bpt-time,
.bpt-host-caption {
  color: var(--muted-foreground, #929292);
  font-size: 12px;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}
.bpt-time > span {
  color: var(--muted-foreground, #929292);
}
.bpt-track {
  overflow: hidden;
  height: 2px;
  margin-top: 2px;
  border-radius: 1px;
  background: var(--border, #303030);
}
.bpt-progress {
  height: 100%;
  background: var(--foreground, #ededed);
  transform-origin: left center;
}
.bpt-sr-only {
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
@media (prefers-reduced-motion: reduce) {
  .bpt-button {
    transition: none;
  }
}
@media (forced-colors: active) {
  .bpt-button:disabled {
    color: GrayText;
    opacity: 1;
  }
  .bpt-progress {
    background: CanvasText;
  }
}

```

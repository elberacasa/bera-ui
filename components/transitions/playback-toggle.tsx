"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  MouseEvent,
  Ref,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { useMotionPreference } from "./use-motion-preference";
import "./playback-toggle.css";

export interface PlaybackToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type" | "aria-label" | "aria-pressed" | "defaultValue"
> {
  /** Connect to actual media state; requests do not optimistically change it. */
  playing?: boolean;
  defaultPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  labels?: { play: string; pause: string };
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

function PlaybackControl({
  playing,
  defaultPlaying = false,
  onPlayingChange,
  labels = DEFAULT_LABELS,
  buttonRef,
  speed = 1,
  radius = 12,
  replayKey = 0,
  disabled = false,
  className = "",
  style,
  title,
  onClick,
  ...buttonProps
}: ControlProps) {
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
    let playback = animate(
      progress,
      replay && !disabled ? 1 - target : target,
      spring,
    );
    if (replay && !disabled) {
      void playback.then(() => {
        if (!cancelled) playback = animate(progress, target, spring);
      });
    }
    return () => {
      cancelled = true;
      playback.stop();
    };
  }, [active, disabled, progress, rate, reduced, replayKey]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;
    const next = !(playing ?? localValue.current);
    if (playing === undefined) {
      localValue.current = next;
      setLocalPlaying(next);
    }
    onPlayingChange?.(next);
  }

  const action =
    (active ? labels.pause : labels.play).trim() ||
    (active ? DEFAULT_LABELS.pause : DEFAULT_LABELS.play);
  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type="button"
      className={`bpt-button ${className}`}
      style={
        {
          "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
          ...style,
        } as CSSProperties
      }
      aria-label={action}
      aria-pressed={undefined}
      data-playing={active}
      disabled={disabled}
      title={title ?? action}
      onClick={handleClick}
    >
      <svg
        className="bpt-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <motion.path data-playback-path="left" d={left} />
        <motion.path data-playback-path="right" d={right} />
      </svg>
    </button>
  );
}

function AnimationPreview({ onPlayingChange, ...props }: ControlProps) {
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const clock = useMotionValue(0);
  const reduced = useMotionPreference();
  const progress = useTransform(
    clock,
    (value) => (reduced ? Math.floor(value) : value) / PREVIEW_DURATION,
  );
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
    if (!playing) return;
    let cancelled = false;
    const playback = animate(clock, PREVIEW_DURATION, {
      duration: PREVIEW_DURATION - clock.get(),
      ease: "linear",
    });
    timer.current = playback;
    void playback.then(() => {
      if (cancelled) return;
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
    if (!node) return;
    const pause = () => {
      timer.current?.stop();
      setPlaying(false);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause();
    });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    observer.observe(node);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function changePlaying(next: boolean) {
    if (next && clock.get() >= PREVIEW_DURATION) clock.jump(0);
    setPlaying(next);
    setAnnouncement("");
    onPlayingChange?.(next);
  }

  return (
    <div className="bpt-preview" ref={root} data-preview="true">
      <PlaybackControl
        {...props}
        playing={playing}
        onPlayingChange={changePlaying}
      />
      <div className="bpt-preview-detail">
        <span className="bpt-preview-label">Animation preview</span>
        <span
          className="bpt-time"
          role="timer"
          aria-label="Preview elapsed time"
        >
          0:{String(seconds).padStart(2, "0")} <span>/ 0:08</span>
        </span>
        <div className="bpt-track" aria-hidden="true">
          <motion.div className="bpt-progress" style={{ scaleX: progress }} />
        </div>
      </div>
      <span className="bpt-sr-only" role="status" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}

/** A play/pause action. Connect controlled state to the host's real playback events. */
export function PlaybackToggle({
  preview = false,
  ...props
}: PlaybackToggleProps) {
  if (preview && props.playing === undefined)
    return <AnimationPreview {...props} />;
  const button = <PlaybackControl {...props} />;
  if (!preview) return button;
  return (
    <div className="bpt-preview" data-preview="true">
      {button}
      <div className="bpt-preview-detail">
        <span className="bpt-preview-label">Playback control</span>
        <span className="bpt-host-caption">Host playback state</span>
      </div>
    </div>
  );
}

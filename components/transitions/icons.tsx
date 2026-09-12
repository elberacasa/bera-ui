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
  useReducedMotion,
  useTransform,
} from "motion/react";
import "./icons.css";

export interface MorphingIconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type" | "aria-label" | "aria-pressed"
> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Stable accessible name for the toggle, for example "Navigation menu". */
  label?: string;
  /** State captions and fallback tooltips. The accessible toggle name stays stable. */
  labels?: { unpressed: string; pressed: string };
  /** Ref to the actual button, for the host's existing focus management. */
  buttonRef?: Ref<HTMLButtonElement>;
  preview?: boolean;
  /** Playback rate: 1 is normal; .35 is slow motion. */
  speed?: number;
  radius?: number;
  /** Replays only the icon; never changes pressed state or invokes a callback. */
  replayKey?: number;
}

// Each path keeps one M and one C command in every pose. The original strokes
// shorten, gather, and become the cross; no icon is replaced or remounted.
const TOP_STROKE = [
  "M5 7C9.67 7 14.33 7 19 7",
  "M5.5 9C9.83 8.7 14.17 10.7 18.5 11",
  "M7 7C10.33 10.33 13.67 13.67 17 17",
];
const MIDDLE_STROKE = [
  "M5 12C9.67 12 14.33 12 19 12",
  "M9 12C11 12 13 12 15 12",
  "M12 12C12 12 12 12 12 12",
];
const BOTTOM_STROKE = [
  "M5 17C9.67 17 14.33 17 19 17",
  "M5.5 15C9.83 15.3 14.17 13.3 18.5 13",
  "M7 17C10.33 13.67 13.67 10.33 17 7",
];
const DEFAULT_LABELS = { unpressed: "Menu", pressed: "Close" };

/**
 * A native toggle button whose three SVG strokes become a close icon.
 * The host owns any associated panel, menu semantics, and dismissal behavior.
 */
export function MorphingIconButton({
  pressed,
  defaultPressed = false,
  onPressedChange,
  label = "Navigation menu",
  labels = DEFAULT_LABELS,
  buttonRef,
  preview = false,
  speed = 1,
  radius = 12,
  replayKey = 0,
  disabled = false,
  className = "",
  style,
  title,
  onClick,
  ...buttonProps
}: MorphingIconButtonProps) {
  const [localPressed, setLocalPressed] = useState(defaultPressed);
  const localValue = useRef(defaultPressed);
  const active = pressed ?? localPressed;
  const reduced = Boolean(useReducedMotion());
  const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
  const progress = useMotionValue(active ? 1 : 0);
  const previousReplay = useRef(replayKey);
  const top = useTransform(progress, [0, 0.28, 1], TOP_STROKE);
  const middle = useTransform(progress, [0, 0.2, 0.42], MIDDLE_STROKE);
  const bottom = useTransform(progress, [0, 0.28, 1], BOTTOM_STROKE);
  const middleOpacity = useTransform(progress, [0, 0.18, 0.36], [1, 0.8, 0]);

  useEffect(() => {
    const replay = previousReplay.current !== replayKey;
    previousReplay.current = replayKey;
    const target = active ? 1 : 0;
    if (reduced) {
      progress.set(target);
      return;
    }

    const spring = {
      type: "spring" as const,
      stiffness: 420 * rate * rate,
      damping: 34 * rate,
      mass: 0.9,
      restDelta: 0.001,
      restSpeed: 0.01,
    };
    let cancelled = false;
    // One spring drives every path. Retargeting retains its current geometry
    // and velocity, including when a click interrupts a preview replay.
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
    // Keep consecutive uncontrolled requests correct even before a render.
    const next = !(pressed ?? localValue.current);
    if (pressed === undefined) {
      localValue.current = next;
      setLocalPressed(next);
    }
    onPressedChange?.(next);
  }

  const stateLabel = active ? labels.pressed : labels.unpressed;
  const button = (
    <button
      {...buttonProps}
      ref={buttonRef}
      type="button"
      className={`bi-morph-button ${className}`}
      style={
        {
          "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
          ...style,
        } as CSSProperties
      }
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={title ?? stateLabel}
      onClick={handleClick}
    >
      <svg
        className="bi-morph-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <motion.path data-stroke="top" d={top} />
        <motion.path data-stroke="middle" d={middle} opacity={middleOpacity} />
        <motion.path data-stroke="bottom" d={bottom} />
      </svg>
    </button>
  );

  if (!preview) return button;
  return (
    <div className="bi-morph-preview" data-preview="true">
      {button}
      <div className="bi-morph-caption" aria-hidden="true">
        <span>{stateLabel}</span>
        <span>Icon preview</span>
      </div>
    </div>
  );
}

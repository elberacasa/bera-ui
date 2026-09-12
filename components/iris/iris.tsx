"use client";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IrisLens } from "./iris-lens";
import { atmospheres, clampIntensity, type IrisValue } from "./atmospheres";

export type IrisProps = {
  value: IrisValue;
  onChange: (value: IrisValue) => void;
  className?: string;
};

/** Controlled light instrument. Pair with IrisAtmospheres for preset selection. */
export function Iris({ value, onChange, className = "" }: IrisProps) {
  const dial = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    angle: number;
    intensity: number;
    pointerId: number;
  } | null>(null);
  const theme =
    atmospheres.find((a) => a.id === value.atmosphere) ?? atmospheres[1];
  const safe = {
    atmosphere: theme.id,
    intensity: clampIntensity(value.intensity),
  };
  const setIntensity = (intensity: number) =>
    onChange({ ...safe, intensity: clampIntensity(intensity) });
  const getAngle = (e: PointerEvent<HTMLButtonElement>) => {
    const r = dial.current!.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - r.top - r.height / 2,
        e.clientX - r.left - r.width / 2,
      ) *
        180) /
      Math.PI
    );
  };
  const angle = -225 + safe.intensity * 2.7;
  const style = {
    "--surface": theme.background,
    "--ink": theme.ink,
    "--accent": theme.accent,
  } as CSSProperties;
  return (
    <div className={`iris-component ${className}`} style={style}>
      <div className="iris-instrument" ref={dial}>
        <div className="dial-scale" aria-hidden="true">
          {Array.from({ length: 55 }, (_, i) => (
            <i
              key={i}
              className={i <= (safe.intensity / 100) * 54 ? "lit" : ""}
              style={
                {
                  "--tick-angle": `${-135 + i * 5}deg`,
                  "--tick-length": i % 9 === 0 ? "9px" : "4px",
                } as CSSProperties
              }
            />
          ))}
        </div>
        <IrisLens value={safe} />
        <div className="dial-center" aria-hidden="true">
          <span>Light</span>
          <output>
            {safe.intensity}
            <span>%</span>
          </output>
        </div>
        <button
          type="button"
          className="dial-knob"
          role="slider"
          aria-label="Light dial"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safe.intensity}
          aria-valuetext={`${safe.intensity}% light`}
          style={
            {
              "--knob-x": `${50 + 46.7 * Math.cos((angle * Math.PI) / 180)}%`,
              "--knob-y": `${50 + 46.7 * Math.sin((angle * Math.PI) / 180)}%`,
            } as CSSProperties
          }
          onPointerDown={(e) => {
            drag.current = {
              angle: getAngle(e),
              intensity: safe.intensity,
              pointerId: e.pointerId,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (
              !d ||
              d.pointerId !== e.pointerId ||
              !e.currentTarget.hasPointerCapture(e.pointerId)
            )
              return;
            const next = getAngle(e);
            const delta = ((next - d.angle + 540) % 360) - 180;
            d.angle = next;
            d.intensity = Math.max(0, Math.min(100, d.intensity + delta / 2.7));
            setIntensity(d.intensity);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onPointerUp={(e) => {
            drag.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onKeyDown={(e) => {
            if (
              [
                "ArrowRight",
                "ArrowUp",
                "ArrowLeft",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(e.key)
            ) {
              e.preventDefault();
              setIntensity(
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? 100
                    : safe.intensity +
                      (["ArrowRight", "ArrowUp", "PageUp"].includes(e.key)
                        ? 1
                        : -1) *
                        (e.key.startsWith("Page") ? 10 : 1),
              );
            }
          }}
        >
          <span />
        </button>
      </div>
      <div className="light-controls">
        <span aria-hidden="true">−</span>
        <SliderPrimitive.Root
          data-slot="slider"
          className="iris-linear-slider"
          min={0}
          max={100}
          step={1}
          value={[safe.intensity]}
          onValueChange={(v) => setIntensity(v[0])}
        >
          <SliderPrimitive.Track data-slot="slider-track">
            <SliderPrimitive.Range data-slot="slider-range" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            aria-label="Light intensity"
            aria-valuetext={`${safe.intensity}% light`}
          />
        </SliderPrimitive.Root>
        <span aria-hidden="true">+</span>
      </div>
    </div>
  );
}

export function IrisAtmospheres({
  value,
  onChange,
  className = "",
}: IrisProps) {
  return (
    <RadioGroup
      className={`atmosphere-options ${className}`}
      value={value.atmosphere}
      onValueChange={(id) =>
        onChange({ ...value, atmosphere: id as IrisValue["atmosphere"] })
      }
      aria-label="Atmosphere"
    >
      {atmospheres.map((a) => (
        <label
          key={a.id}
          className={`atmosphere-option ${value.atmosphere === a.id ? "selected" : ""}`}
        >
          <RadioGroupItem value={a.id} aria-label={a.name} />
          <span
            className={`material-swatch swatch-${a.id}`}
            aria-hidden="true"
          />
          <span>{a.name}</span>
          <svg
            className="selection-check"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path
              d="m3 8 3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </label>
      ))}
    </RadioGroup>
  );
}

"use client";

import { MotionConfig } from "motion/react";
import { PlaybackToggle } from "../transitions/playback-toggle";
import "./playback-preview.css";

export function PlaybackComparisonPreview({
  enhanced,
  playing,
  onPlayingChange,
  speed,
}: {
  enhanced: boolean;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  speed: number;
}) {
  return (
    <div className="bc-playback-preview">
      <MotionConfig reducedMotion={enhanced ? "user" : "always"}>
        <PlaybackToggle
          playing={playing}
          onPlayingChange={onPlayingChange}
          labels={{ play: "Show pause shape", pause: "Show play shape" }}
          speed={speed}
          radius={18}
          className="bc-playback-control"
        />
      </MotionConfig>
      <div className="bc-playback-caption" aria-hidden="true">
        <span>{playing ? "Pause" : "Play"}</span>
        <small>SVG transition</small>
      </div>
    </div>
  );
}

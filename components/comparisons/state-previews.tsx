"use client";

import { useId, type CSSProperties } from "react";
import Link from "next/link";
import { CheckCheck, FileCheck2, MessageSquare } from "lucide-react";
import {
  TextSwap,
  type TextSwapStatus,
} from "@/components/transitions/feedback";
import { MorphingIconButton } from "@/components/transitions/icons";
import "./state-previews.css";

type ComparisonPlayback = {
  enhanced: boolean;
  speed: number;
  replayKey: number;
};

type IconComparisonPreviewProps = ComparisonPlayback & {
  value: boolean;
  onValueChange?: (value: boolean) => void;
};

type TextComparisonPreviewProps = ComparisonPlayback & {
  value: string;
};

const navigationLabels = {
  unpressed: "Open navigation",
  pressed: "Close navigation",
};

const statuses: readonly TextSwapStatus[] = [
  { text: "Draft saved", Icon: FileCheck2 },
  { text: "Ready for review", Icon: MessageSquare },
  { text: "Changes approved", Icon: CheckCheck },
];

/** The host navigation changes immediately in both columns; only its icon morphs. */
export function IconComparisonPreview({
  enhanced,
  speed,
  replayKey,
  value,
  onValueChange,
}: IconComparisonPreviewProps) {
  const navigationId = useId();
  const toggleStyle = { "--bera-radius": "10px" } as CSSProperties;

  return (
    <div className="bc-navigation-preview">
      <div className="bc-navigation-header">
        <span>Workspace</span>
        {enhanced ? (
          <MorphingIconButton
            label="Workspace navigation"
            labels={navigationLabels}
            pressed={value}
            onPressedChange={onValueChange}
            aria-expanded={value}
            aria-controls={navigationId}
            radius={10}
            speed={speed}
            replayKey={replayKey}
          />
        ) : (
          <button
            type="button"
            className="bi-morph-button"
            style={toggleStyle}
            aria-label="Workspace navigation"
            aria-pressed={value}
            aria-expanded={value}
            aria-controls={navigationId}
            title={
              value ? navigationLabels.pressed : navigationLabels.unpressed
            }
            onClick={() => onValueChange?.(!value)}
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
              <path
                data-stroke="top"
                d={
                  value
                    ? "M7 7C10.33 10.33 13.67 13.67 17 17"
                    : "M5 7C9.67 7 14.33 7 19 7"
                }
              />
              <path
                data-stroke="middle"
                d={
                  value
                    ? "M12 12C12 12 12 12 12 12"
                    : "M5 12C9.67 12 14.33 12 19 12"
                }
                opacity={value ? 0 : 1}
              />
              <path
                data-stroke="bottom"
                d={
                  value
                    ? "M7 17C10.33 13.67 13.67 10.33 17 7"
                    : "M5 17C9.67 17 14.33 17 19 17"
                }
              />
            </svg>
          </button>
        )}
      </div>
      <div className="bc-navigation-space">
        <nav id={navigationId} aria-label="Workspace" hidden={!value}>
          <Link href="/#transitions">Transitions</Link>
          <Link href="/agents">Agent skill</Link>
        </nav>
      </div>
    </div>
  );
}

/** Status changes are a local preview, with no implied save or approval action. */
export function TextComparisonPreview({
  enhanced,
  speed,
  replayKey,
  value,
}: TextComparisonPreviewProps) {
  const index = Math.max(
    0,
    statuses.findIndex((status) => status.text === value),
  );
  const status = statuses[index];
  // A controlled cycle changes the motion key without changing the status text.
  const presentationIndex =
    index + Math.max(0, Math.floor(replayKey)) * statuses.length;

  return (
    <div className="bc-status-preview">
      <span className="bc-status-context">Review status</span>
      {enhanced ? (
        <TextSwap statuses={statuses} value={presentationIndex} speed={speed} />
      ) : (
        <div className="bf-preview" data-preview="false">
          <div className="bf-main">
            <div className="bf-status-line" aria-hidden="true">
              <div className="bf-status-content">
                <span className="bf-status-icon">
                  <status.Icon size={21} strokeWidth={1.6} />
                </span>
                <span className="bf-status-words">
                  {status.text.split(" ").map((word, wordIndex) => (
                    <span key={`${word}-${wordIndex}`}>{word}</span>
                  ))}
                </span>
              </div>
            </div>
            <span className="bf-sr-only" role="status" aria-atomic="true">
              {status.text}
            </span>
          </div>
        </div>
      )}
      <span className="bc-status-note">Local preview</span>
    </div>
  );
}

# Integrate bera/ui: CopyButton

Read the host project first. Bring this transition into the existing interface, preserving its fonts, colors, content, semantics, and real behavior.

Dependencies: React, motion/react, lucide-react. Import the matching CSS alongside the module. Keep only the selected export and its shared helpers. Remove the outer preview frame, helper captions, sample data, and demo controls where they are not part of the host interaction. Do not add another animation engine.

Connect actions and controlled props to real application state. StateButton without onAction is an explicitly labeled save simulation; ToastStack uses local demonstration notifications. Never claim a real action succeeded based only on a timer. Clipboard confirmation must follow a successful write.

Normal playback is speed=1. The speed and replayKey props are preview controls; replay must not repeat real side effects or steal focus. Preserve reduced motion, focus return, keyboard navigation, and interruption behavior. Validate on a narrow phone viewport and desktop.

Selected export: CopyButton
Source group: feedback

## React

```tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Copy,
  FileCheck2,
  LoaderCircle,
  MessageSquare,
  RotateCcw,
  Save,
  TriangleAlert,
} from "lucide-react";
import "./feedback.css";

export type FeedbackDemoProps = { speed?: number; replayKey?: number };
const EASE = [0.22, 1, 0.36, 1] as const;
const normalizeSpeed = (speed: number) =>
  Number.isFinite(speed) && speed > 0 ? Math.max(0.1, speed) : 1;

/** A replay never runs on initial mount or because an unrelated prop changed. */
function useReplay(replayKey: number, replay: () => void) {
  const action = useRef(replay);
  const previous = useRef(replayKey);
  useEffect(() => {
    action.current = replay;
  }, [replay]);
  useEffect(() => {
    if (previous.current === replayKey) return;
    previous.current = replayKey;
    action.current();
  }, [replayKey]);
}

/** Cancels pending visual work and invalidates older asynchronous results. */
function useSequence() {
  const revision = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancel = useCallback(() => {
    revision.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    return revision.current;
  }, []);
  const later = useCallback((id: number, delay: number, action: () => void) => {
    const timer = setTimeout(() => {
      timers.current = timers.current.filter((item) => item !== timer);
      if (revision.current === id) action();
    }, delay);
    timers.current.push(timer);
  }, []);
  useEffect(
    () => () => {
      cancel();
    },
    [cancel],
  );
  return { cancel, later, revision };
}

type SaveState = "idle" | "loading" | "success" | "error";
export type StateButtonProps = FeedbackDemoProps & {
  /** Omit for the explicitly labeled simulation. Supplied actions run only on click. */
  onAction?: () => Promise<void>;
};

/** Useful for save/submit feedback; the demo simulation can safely be restarted. */
export function StateButton({
  speed: requestedSpeed = 1,
  replayKey = 0,
  onAction,
}: StateButtonProps) {
  const speed = normalizeSpeed(requestedSpeed);
  const reduced = Boolean(useReducedMotion());
  const [state, setState] = useState<SaveState>("idle");
  const pendingAction = useRef(false);
  const { cancel, later, revision } = useSequence();
  const duration = (seconds: number) => (reduced ? 0 : seconds / speed);
  const complete = useCallback(
    (id: number) => {
      if (revision.current !== id) return;
      setState("success");
      later(id, 1450 / speed, () => setState("idle"));
    },
    [later, revision, speed],
  );
  const run = useCallback(() => {
    if (pendingAction.current) return;
    const id = cancel();
    setState("loading");
    if (onAction) {
      pendingAction.current = true;
      // Promise.resolve also converts a synchronous throw into visible error feedback.
      Promise.resolve()
        .then(onAction)
        .then(
          () => {
            pendingAction.current = false;
            complete(id);
          },
          () => {
            pendingAction.current = false;
            if (revision.current === id) setState("error");
          },
        );
    } else {
      later(id, 850 / speed, () => complete(id));
    }
  }, [cancel, complete, later, onAction, revision, speed]);
  const replay = useCallback(() => {
    // A gallery replay must never repeat a real save or submit action.
    // Its promise cannot be cancelled by clearing a visual timer.
    if (pendingAction.current) return;
    if (onAction) {
      cancel();
      setState("idle");
    } else run();
  }, [cancel, onAction, run]);
  useReplay(replayKey, replay);

  const labels = {
    idle: "Save changes",
    loading: "Saving",
    success: "Saved",
    error: "Try again",
  };
  const widths = { idle: 164, loading: 132, success: 118, error: 146 };
  const Icon = {
    idle: Save,
    loading: LoaderCircle,
    success: Check,
    error: TriangleAlert,
  }[state];
  return (
    <div className="bf-preview bf-save-preview">
      <div className="bf-main">
        <motion.button
          type="button"
          className="bf-state-button"
          disabled={state === "loading" || state === "success"}
          aria-label={labels[state]}
          aria-busy={state === "loading"}
          onClick={run}
          initial={false}
          animate={{
            width: widths[state],
            borderRadius: state === "loading" ? 24 : 13,
          }}
          transition={{ duration: duration(0.42), ease: EASE }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={state}
              className="bf-button-content"
              initial={{
                opacity: 0,
                y: reduced ? 0 : 9,
                filter: reduced ? "blur(0px)" : "blur(4px)",
              }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: reduced ? 0 : -7,
                filter: reduced ? "blur(0px)" : "blur(3px)",
              }}
              transition={{ duration: duration(0.24), ease: EASE }}
              aria-hidden="true"
            >
              <motion.span
                className="bf-icon"
                animate={{ rotate: state === "loading" && !reduced ? 360 : 0 }}
                transition={
                  state === "loading" && !reduced
                    ? {
                        duration: 0.8 / speed,
                        repeat: Infinity,
                        ease: "linear",
                      }
                    : { duration: 0 }
                }
              >
                <Icon size={16} strokeWidth={1.8} />
              </motion.span>
              <span>{labels[state]}</span>
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <span className="bf-sr-only" role="status">
          {state === "success"
            ? "Changes saved."
            : state === "error"
              ? "The action failed. Try again."
              : ""}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>
          {state === "error"
            ? "Couldn’t save. Try again."
            : onAction
              ? "Connected to your action"
              : "Simulated save"}
        </span>
        {!onAction && (
          <button type="button" className="bf-small-button" onClick={replay}>
            <RotateCcw size={12} aria-hidden="true" />
            Replay
          </button>
        )}
      </div>
    </div>
  );
}

const STATUSES = [
  { text: "Changes saved.", Icon: FileCheck2 },
  { text: "Ready for review.", Icon: MessageSquare },
  { text: "You’re all set.", Icon: CheckCheck },
] as const;

export type TextSwapStatus = {
  text: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};
export type TextSwapProps = FeedbackDemoProps & {
  statuses?: readonly TextSwapStatus[];
};

/** A status sentence changes directionally; the glyphs never stretch. */
export function TextSwap({
  speed: requestedSpeed = 1,
  replayKey = 0,
  statuses = STATUSES,
}: TextSwapProps) {
  const speed = normalizeSpeed(requestedSpeed);
  const reduced = Boolean(useReducedMotion());
  const [step, setStep] = useState(0);
  const next = useCallback(() => setStep((current) => current + 1), []);
  useReplay(replayKey, next);
  const choices = statuses.length ? statuses : STATUSES;
  const status = choices[step % choices.length];
  return (
    <div className="bf-preview">
      <div className="bf-main">
        <div className="bf-status-line" aria-hidden="true">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={step}
              className="bf-status-content"
              initial="enter"
              animate="visible"
              exit="exit"
              variants={{
                enter: {},
                visible: {
                  transition: { staggerChildren: reduced ? 0 : 0.035 / speed },
                },
                exit: {
                  transition: {
                    staggerChildren: reduced ? 0 : 0.018 / speed,
                    staggerDirection: -1,
                  },
                },
              }}
            >
              <motion.span
                className="bf-status-icon"
                variants={{
                  enter: {
                    opacity: 0,
                    y: reduced ? 0 : 8,
                    rotate: reduced ? 0 : -12,
                  },
                  visible: { opacity: 1, y: 0, rotate: 0 },
                  exit: {
                    opacity: 0,
                    y: reduced ? 0 : -8,
                    rotate: reduced ? 0 : 8,
                  },
                }}
                transition={{ duration: reduced ? 0 : 0.3 / speed, ease: EASE }}
              >
                <status.Icon size={21} strokeWidth={1.6} />
              </motion.span>
              <span className="bf-status-words">
                {status.text.split(" ").map((word, index) => (
                  <motion.span
                    key={`${word}-${index}`}
                    variants={{
                      enter: {
                        opacity: 0,
                        y: reduced ? 0 : 10,
                        filter: reduced ? "blur(0px)" : "blur(5px)",
                      },
                      visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                      exit: {
                        opacity: 0,
                        y: reduced ? 0 : -9,
                        filter: reduced ? "blur(0px)" : "blur(4px)",
                      },
                    }}
                    transition={{
                      duration: reduced ? 0 : 0.3 / speed,
                      ease: EASE,
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="bf-sr-only" role="status" aria-atomic="true">
          {status.text}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>Status feedback</span>
        <button type="button" className="bf-small-button" onClick={next}>
          Next state
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export type CopyButtonProps = FeedbackDemoProps & { text?: string };
type CopyState = "idle" | "pending" | "copied" | "error";

/** The clipboard write is real. Replay only resets the feedback; it never writes. */
export function CopyButton({
  speed: requestedSpeed = 1,
  replayKey = 0,
  text = "npm install motion",
}: CopyButtonProps) {
  const speed = normalizeSpeed(requestedSpeed);
  const reduced = Boolean(useReducedMotion());
  const [feedback, setFeedback] = useState<{ text: string; state: CopyState }>({
    text,
    state: "idle",
  });
  // Reset the feedback before committing a changed payload, keeping the same
  // button DOM node and its focus. Results always carry their captured text.
  if (feedback.text !== text) setFeedback({ text, state: "idle" });
  const state = feedback.text === text ? feedback.state : "idle";
  const pendingCopy = useRef<number | null>(null);
  const { cancel, later, revision } = useSequence();
  useEffect(() => {
    cancel();
    pendingCopy.current = null;
  }, [text, cancel]);
  const reset = useCallback(() => {
    if (pendingCopy.current !== null) return;
    cancel();
    setFeedback({ text, state: "idle" });
  }, [cancel, text]);
  useReplay(replayKey, reset);
  async function copy() {
    if (pendingCopy.current !== null) return;
    const id = cancel();
    pendingCopy.current = id;
    setFeedback({ text, state: "pending" });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (revision.current !== id) return;
      setFeedback({ text, state: "copied" });
      later(id, 2200 / speed, () => setFeedback({ text, state: "idle" }));
    } catch {
      if (revision.current === id) setFeedback({ text, state: "error" });
    } finally {
      if (pendingCopy.current === id) pendingCopy.current = null;
    }
  }
  const label =
    state === "copied"
      ? "Copied"
      : state === "error"
        ? "Try copying again"
        : state === "pending"
          ? "Copying"
          : "Copy command";
  const Icon =
    state === "copied" ? Check : state === "error" ? TriangleAlert : Copy;
  return (
    <div className="bf-preview bf-copy-preview">
      <div className="bf-main">
        <div className="bf-copy-block">
          <code className="bf-command" title={text}>
            {text}
          </code>
          <motion.button
            type="button"
            className="bf-copy-button"
            onClick={copy}
            disabled={state === "pending"}
            aria-label={label}
            aria-busy={state === "pending"}
            initial={false}
            animate={{
              width: state === "copied" ? 109 : state === "error" ? 165 : 153,
            }}
            transition={{ duration: reduced ? 0 : 0.36 / speed, ease: EASE }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={state}
                className="bf-button-content"
                aria-hidden="true"
                initial={{
                  opacity: 0,
                  y: reduced ? 0 : 7,
                  filter: reduced ? "blur(0px)" : "blur(3px)",
                }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  y: reduced ? 0 : -7,
                  filter: reduced ? "blur(0px)" : "blur(3px)",
                }}
                transition={{
                  duration: reduced ? 0 : 0.22 / speed,
                  ease: EASE,
                }}
              >
                <motion.span
                  className="bf-icon"
                  initial={{
                    rotate: reduced ? 0 : state === "copied" ? -25 : 0,
                    scale: reduced ? 1 : 0.8,
                  }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    duration: reduced ? 0 : 0.32 / speed,
                    ease: EASE,
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </motion.span>
                <span>{label}</span>
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <AnimatePresence initial={false}>
            {state === "error" && (
              <motion.label
                className="bf-manual-copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.16 / speed }}
              >
                Copy manually
                <input
                  value={text}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
              </motion.label>
            )}
          </AnimatePresence>
        </div>
        <span className="bf-sr-only" role="status">
          {state === "copied"
            ? "Command copied to clipboard."
            : state === "error"
              ? "Clipboard unavailable. Select and copy the text in the manual copy field."
              : ""}
        </span>
      </div>
      <div className="bf-demo-footer">
        <span>
          {state === "copied"
            ? "Ready to paste"
            : state === "error"
              ? "Clipboard access unavailable"
              : "Copies to your clipboard"}
        </span>
        <button
          type="button"
          className="bf-small-button"
          aria-disabled={state === "idle" || state === "pending"}
          onClick={() => {
            if (state !== "idle") reset();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export const feedbackRegistry: ReadonlyArray<{
  id: string;
  name: string;
  category: "Feedback" | "Text";
  description: string;
  Component: ComponentType<FeedbackDemoProps>;
  replayLabel: string;
  usage: string;
}> = [
  {
    id: "state-button",
    name: "State button",
    category: "Feedback",
    description: "One button carries the action from intent to completion.",
    Component: StateButton,
    replayLabel: "Replay simulation",
    usage:
      "<StateButton speed={1} replayKey={0} />\n// To connect a real save: onAction={() => saveChanges()}",
  },
  {
    id: "text-swap",
    name: "Text swap",
    category: "Text",
    description:
      "A status changes a few words at a time, with a quiet directional handoff.",
    Component: TextSwap,
    replayLabel: "Next state",
    usage: "<TextSwap speed={1} replayKey={0} />",
  },
  {
    id: "copy-button",
    name: "Copy feedback",
    category: "Feedback",
    description:
      "A real clipboard action, with a clear confirmation and a manual fallback.",
    Component: CopyButton,
    replayLabel: "Reset feedback",
    usage: '<CopyButton text="npm install motion" speed={1} replayKey={0} />',
  },
];

```

## CSS

```css
.bf-preview {
  --bf-ink: var(--foreground, #eeeeee);
  --bf-muted: var(--muted-foreground, #888888);
  --bf-panel: var(--popover, #191919);
  --bf-border: var(--border, #303030);
  --bf-primary: var(--primary, #eeeeee);
  --bf-primary-ink: var(--primary-foreground, #191919);
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 320px;
  height: 230px;
  margin-inline: auto;
  color: var(--bf-ink);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}
.bf-preview *,
.bf-preview *::before,
.bf-preview *::after {
  box-sizing: border-box;
}
.bf-preview button,
.bf-preview input {
  font: inherit;
}
.bf-preview button {
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.bf-preview button:disabled {
  cursor: default;
}
.bf-preview button:focus-visible,
.bf-preview input:focus-visible {
  outline: 2px solid var(--bf-ink);
  outline-offset: 5px;
}
.bf-main {
  height: 187px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}
.bf-state-button,
.bf-copy-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  height: 48px;
  padding: 0;
  border: 1px solid
    color-mix(in srgb, var(--bf-primary) 88%, var(--bf-primary-ink));
  border-radius: 13px;
  white-space: nowrap;
  font-weight: 550 !important;
  letter-spacing: -0.18px;
  background: var(--bf-primary);
  color: var(--bf-primary-ink);
  box-shadow:
    0 1px 0 #ffffff50 inset,
    0 4px 12px #00000025;
}
.bf-state-button:not(:disabled):hover {
  background: color-mix(in srgb, var(--bf-primary) 92%, var(--bf-primary-ink));
}
.bf-state-button:focus-visible {
  outline-offset: 5px;
}
.bf-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  flex-shrink: 0;
  position: relative;
  white-space: nowrap;
}
.bf-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bf-icon svg {
  display: block;
}
.bf-demo-footer {
  height: 43px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 17px;
  color: var(--bf-muted);
  font-size: 10px;
}
.bf-small-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 5px 1px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--bf-ink);
  font-size: 11px !important;
  line-height: 1.2;
}
.bf-small-button:hover:not([aria-disabled="true"]) {
  color: var(--bf-ink);
}
.bf-small-button[aria-disabled="true"] {
  cursor: default;
  opacity: 0.35;
}
.bf-status-line {
  position: relative;
  display: flex;
  align-items: center;
  width: 248px;
  min-height: 40px;
}
.bf-status-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.bf-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  color: color-mix(in srgb, var(--bf-ink) 75%, var(--bf-muted));
}
.bf-status-words {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.27em;
  font-size: 16px;
  font-weight: 450;
  letter-spacing: -0.38px;
  white-space: nowrap;
}
.bf-status-words > span {
  display: inline-block;
}
.bf-copy-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 18px;
}
.bf-command {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: color-mix(in srgb, var(--bf-ink) 65%, var(--bf-muted));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  letter-spacing: -0.25px;
}
.bf-copy-button {
  height: 41px;
  color: var(--bf-ink);
  background: var(--bf-panel);
  border: 1px solid var(--bf-border);
  border-radius: 10px;
  box-shadow:
    0 1px 0 #ffffff05 inset,
    0 2px 5px #00000020;
  font-size: 12px !important;
}
.bf-copy-button:hover {
  background: color-mix(in srgb, var(--bf-panel) 87%, var(--bf-ink));
}
.bf-manual-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  max-width: 258px;
  color: var(--bf-muted);
  font-size: 10px;
}
.bf-manual-copy input {
  width: 100%;
  min-width: 0;
  height: 32px;
  border: 1px solid var(--bf-border);
  border-radius: 6px;
  padding: 5px 8px;
  background: var(--bf-panel);
  color: var(--bf-ink);
  font-size: 11px;
}
.bf-sr-only {
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
  .bf-preview *,
  .bf-preview *::before,
  .bf-preview *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
@media (pointer: coarse) {
  .bf-small-button {
    min-height: 40px;
  }
  .bf-manual-copy input {
    font-size: 16px;
  }
}

```

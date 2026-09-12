"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
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

export type FeedbackDemoProps = {
  preview?: boolean;
  speed?: number;
  replayKey?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
};
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
  /** Required for application use. Omit only with preview=true for a labeled simulation. */
  onAction?: () => Promise<void>;
};

/** Useful for save/submit feedback; the demo simulation can safely be restarted. */
export function StateButton({
  speed: requestedSpeed = 1,
  radius = 12,
  preview = false,
  className = "",
  style,
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
    if (pendingAction.current || (!onAction && !preview)) return;
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
  }, [cancel, complete, later, onAction, preview, revision, speed]);
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
    <div
      data-preview={preview}
      className={`bf-preview bf-save-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="bf-main">
        <motion.button
          type="button"
          className="bf-state-button"
          disabled={
            (!preview && !onAction) ||
            state === "loading" ||
            state === "success"
          }
          aria-label={labels[state]}
          aria-busy={state === "loading"}
          onClick={run}
          initial={false}
          animate={{
            width: widths[state],
            borderRadius:
              state === "loading" ? 24 : Math.max(0, Math.min(24, radius)),
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
  /** Controlled status index for application progress or feedback. */
  value?: number;
};

/** A status sentence changes directionally; the glyphs never stretch. */
export function TextSwap({
  speed: requestedSpeed = 1,
  radius = 12,
  preview = false,
  className = "",
  style,
  replayKey = 0,
  statuses,
  value,
}: TextSwapProps) {
  const speed = normalizeSpeed(requestedSpeed);
  const reduced = Boolean(useReducedMotion());
  const [step, setStep] = useState(0);
  const next = useCallback(() => setStep((current) => current + 1), []);
  useReplay(replayKey, next);
  const choices = statuses?.length ? statuses : preview ? STATUSES : [];
  const current =
    value === undefined
      ? step
      : Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const status = choices[current % choices.length];
  if (!status) return null;
  return (
    <div
      data-preview={preview}
      className={`bf-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="bf-main">
        <div className="bf-status-line" aria-hidden="true">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`${current}-${status.text}`}
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
        <button
          type="button"
          className="bf-small-button"
          disabled={value !== undefined}
          onClick={next}
        >
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
  radius = 12,
  preview = false,
  className = "",
  style,
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
    <div
      data-preview={preview}
      className={`bf-preview bf-copy-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
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

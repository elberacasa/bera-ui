"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Archive, Check, FileText, RotateCcw, Square, X } from "lucide-react";
import { useMotionPreference } from "./use-motion-preference";
import "./selection-toolbar.css";

export type SelectionToolbarAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void | Promise<void>;
};

export interface SelectionToolbarProps {
  /** Selection belongs to the host. Resolving an action never changes this count. */
  count?: number;
  actions?: readonly SelectionToolbarAction[];
  onClear?: () => void;
  /** Focus returns here only when a focused toolbar closes. Otherwise the host owns focus. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  ariaLabel?: string;
  /** Enables the local file-selection and archive example instead of host actions. */
  preview?: boolean;
  speed?: number;
  radius?: number;
  /** Replays the count's visual settle; never selects, clears, or invokes an action. */
  replayKey?: number;
  className?: string;
  style?: CSSProperties;
}

const noActions: readonly SelectionToolbarAction[] = [];

function SelectionToolbarControl({
  count = 0,
  actions = noActions,
  onClear,
  returnFocusRef,
  ariaLabel = "Selection actions",
  speed = 1,
  radius = 12,
  replayKey = 0,
  className = "",
  style,
}: SelectionToolbarProps) {
  const selected = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const open = selected > 0;
  const reduced = useMotionPreference();
  const rate = Number.isFinite(speed) ? Math.max(0.1, Math.min(4, speed)) : 1;
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const focusWithin = useRef(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const previousReplay = useRef(replayKey);
  const [size, setSize] = useState({ width: 280, height: 56 });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const width = useMotionValue(open ? 280 : 148);
  const height = useMotionValue(open ? 56 : 44);
  const reveal = useMotionValue(open ? 1 : 0);
  const countSettle = useMotionValue(0);
  const actionY = useTransform(reveal, [0, 1], [5, 0]);

  useLayoutEffect(() => {
    const host = container.current;
    const body = content.current;
    if (!host || !body) return;
    const measure = () => {
      const next = { width: host.clientWidth, height: body.offsetHeight + 2 };
      setSize((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(body);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (open || !focusWithin.current) return;
    focusWithin.current = false;
    const target = returnFocusRef?.current;
    // Never focus an invisible mirror or move focus that already left the toolbar.
    if (
      target?.getClientRects().length &&
      !target.closest("[inert]") &&
      !target.matches(":disabled")
    )
      target.focus({ preventScroll: true });
  }, [open, returnFocusRef]);

  useEffect(() => {
    const targetWidth = open ? size.width : Math.min(148, size.width);
    const targetHeight = open ? size.height : 44;
    if (reduced) {
      width.jump(targetWidth);
      height.jump(targetHeight);
      reveal.jump(open ? 1 : 0);
      return;
    }
    // Numeric motion values retain their current position and velocity on reversal.
    const spring = {
      type: "spring" as const,
      stiffness: 420 * rate * rate,
      damping: 35 * rate,
      mass: 0.9,
    };
    const playback = [
      animate(width, targetWidth, spring),
      animate(height, targetHeight, spring),
      animate(reveal, open ? 1 : 0, {
        duration: (open ? 0.2 : 0.1) / rate,
        ease: "easeOut",
      }),
    ];
    return () => playback.forEach((animation) => animation.stop());
  }, [open, size.width, size.height, rate, reduced, width, height, reveal]);

  useEffect(() => {
    if (reduced) {
      previousReplay.current = replayKey;
      countSettle.jump(0);
      return;
    }
    if (previousReplay.current === replayKey) return;
    previousReplay.current = replayKey;
    const playback = animate(countSettle, [0, -3, 0], {
      duration: 0.36 / rate,
      ease: "easeInOut",
    });
    return () => {
      playback.stop();
      countSettle.set(0);
    };
  }, [replayKey, rate, reduced, countSettle]);

  async function run(action: SelectionToolbarAction) {
    if (!open || inFlight.current) return;
    inFlight.current = true;
    setPending(action.id);
    setError(null);
    try {
      await action.onSelect();
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error && failure.message
            ? failure.message
            : `${action.label} could not be completed. Try again.`,
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(null);
    }
  }

  return (
    <div
      ref={container}
      className={`bst-toolbar ${className}`}
      data-open={open}
      style={
        {
          "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
          ...style,
        } as CSSProperties
      }
    >
      <motion.div className="bst-surface" style={{ width, height }}>
        <div
          ref={content}
          className="bst-content"
          style={{ width: Math.max(0, size.width - 2) }}
        >
          <div className="bst-count" aria-live="polite" aria-atomic="true">
            <motion.span
              className="bst-count-mark"
              style={{ y: countSettle }}
              aria-hidden="true"
            >
              {open ? (
                <Check size={15} strokeWidth={2} />
              ) : (
                <Square size={15} strokeWidth={1.5} />
              )}
            </motion.span>
            <span>
              {open ? (
                <>
                  <strong>{selected}</strong> selected
                </>
              ) : (
                "Select items"
              )}
            </span>
          </div>
          <motion.div
            className="bst-controls"
            role="group"
            aria-label={ariaLabel}
            aria-busy={pending !== null}
            aria-hidden={!open}
            inert={!open}
            style={{ opacity: reveal, y: actionY }}
            onFocusCapture={() => {
              focusWithin.current = true;
            }}
            onBlurCapture={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                (open || event.relatedTarget)
              )
                focusWithin.current = false;
            }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="bst-action"
                disabled={pending !== null}
                aria-busy={pending === action.id}
                onClick={() => {
                  void run(action);
                }}
              >
                {action.icon ? (
                  <span className="bst-action-icon" aria-hidden="true">
                    {action.icon}
                  </span>
                ) : null}
                <span>{action.label}</span>
              </button>
            ))}
            {onClear ? (
              <button
                type="button"
                className="bst-clear"
                aria-label="Clear selection"
                disabled={pending !== null}
                onClick={() => {
                  if (open && !inFlight.current) onClear();
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </motion.div>
          {error && open ? (
            <p className="bst-error" role="alert">
              {error}
            </p>
          ) : null}
          <span className="bst-sr-only" role="status">
            {pending !== null
              ? `${actions.find((action) => action.id === pending)?.label ?? "Action"} in progress.`
              : ""}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const previewFiles = [
  { id: "brief", name: "Project brief", detail: "Document" },
  { id: "notes", name: "Meeting notes", detail: "Document" },
  { id: "assets", name: "Brand assets", detail: "Folder" },
] as const;

function SelectionToolbarPreview({
  speed,
  radius,
  replayKey,
  className = "",
  style,
}: SelectionToolbarProps) {
  const [files, setFiles] =
    useState<readonly (typeof previewFiles)[number][]>(previewFiles);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const archived = previewFiles.length - files.length;
  const archive = () => {
    const removed = selected.length;
    setFiles((current) =>
      current.filter((file) => !selected.includes(file.id)),
    );
    setSelected([]);
    setAnnouncement(
      `${removed} ${removed === 1 ? "file" : "files"} archived in this local preview.`,
    );
  };
  return (
    <div
      className={`bst-preview ${className}`}
      data-preview="true"
      style={style}
    >
      <div className="bst-preview-heading">
        <span>Preview selection</span>
        <button
          ref={restore}
          type="button"
          className="bst-restore"
          disabled={!archived}
          onClick={() => {
            setFiles(previewFiles);
            setSelected([]);
            setAnnouncement("Preview files restored.");
          }}
        >
          <RotateCcw size={13} aria-hidden="true" /> Restore
        </button>
      </div>
      <div className="bst-files" role="group" aria-label="Preview files">
        {files.map((file, index) => (
          <label className="bst-file" key={file.id}>
            <input
              ref={
                index === 0
                  ? (element) => {
                      returnFocus.current = element ?? restore.current;
                    }
                  : undefined
              }
              type="checkbox"
              checked={selected.includes(file.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, file.id]
                    : current.filter((id) => id !== file.id),
                )
              }
            />
            <FileText size={16} aria-hidden="true" />
            <span>{file.name}</span>
            <span className="bst-file-detail">{file.detail}</span>
          </label>
        ))}
        {!files.length ? (
          <p className="bst-empty">All preview files archived.</p>
        ) : null}
      </div>
      <SelectionToolbarControl
        count={selected.length}
        actions={[
          {
            id: "archive",
            label: "Archive",
            icon: <Archive size={16} />,
            onSelect: archive,
          },
        ]}
        onClear={() => setSelected([])}
        returnFocusRef={returnFocus}
        speed={speed}
        radius={radius}
        replayKey={replayKey}
      />
      <span className="bst-sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}

/** A count unfolds into real host actions; preview=true provides a local file example. */
export function SelectionToolbar({
  preview = false,
  ...props
}: SelectionToolbarProps) {
  return preview ? (
    <SelectionToolbarPreview {...props} />
  ) : (
    <SelectionToolbarControl {...props} />
  );
}

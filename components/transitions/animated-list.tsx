"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useIsPresent,
} from "motion/react";
import { FileCode2, FileText, Plus, X } from "lucide-react";
import { useMotionPreference } from "./use-motion-preference";
import "./animated-list.css";

export type AnimatedListItem = { id: string; content: ReactNode };

export type AnimatedListProps = {
  /** Stable, unique IDs preserve the host's content and controls across reorder. */
  items?: readonly AnimatedListItem[];
  emptyState?: ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  speed?: number;
  radius?: number;
  /** With supplied items, replays presentation only; no items or focus change. */
  replayKey?: number;
  /** Opt in to a local file-list demonstration and its mutation controls. */
  preview?: boolean;
};

type ListRowProps = {
  item: AnimatedListItem;
  index: number;
  speed: number;
  replayKey: number;
  onExitFocus: (node: HTMLLIElement) => void;
  empty?: boolean;
};

const ListRow = forwardRef<HTMLLIElement, ListRowProps>(function ListRow(
  { item, index, speed, replayKey, onExitFocus, empty = false },
  forwardedRef,
) {
  const nodeRef = useRef<HTMLLIElement | null>(null);
  const present = useIsPresent();
  const reduced = useMotionPreference();
  const controls = useAnimationControls();
  const previousReplay = useRef(replayKey);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (!present) {
      // Move focus before hiding a retained exit node from the accessibility tree.
      onExitFocus(node);
      node.inert = true;
      node.setAttribute("aria-hidden", "true");
    } else {
      node.inert = false;
      node.removeAttribute("aria-hidden");
    }
  }, [present, onExitFocus]);

  useEffect(() => {
    const replayed = previousReplay.current !== replayKey;
    previousReplay.current = replayKey;
    if (!present) return;
    if (reduced) {
      controls.stop();
      controls.set({ opacity: 1, y: 0, x: 0 });
      return;
    }
    if (replayed) controls.set({ opacity: 0.5, y: 4 });
    void controls.start({
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.24 / speed,
        delay: replayed ? Math.min(index, 5) * (0.02 / speed) : 0,
        ease: [0.22, 1, 0.36, 1],
      },
    });
  }, [controls, index, present, reduced, replayKey, speed]);

  return (
    <motion.li
      ref={(node) => {
        nodeRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={`bal-item${empty ? " bal-empty" : ""}`}
      data-list-id={empty ? undefined : item.id}
      data-exiting={present ? undefined : "true"}
      tabIndex={-1}
      layout="position"
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
      animate={controls}
      exit={{
        opacity: 0,
        x: reduced ? 0 : -8,
        transition: { duration: reduced ? 0 : 0.16 / speed },
      }}
      transition={{
        layout: reduced
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 460 * speed * speed,
              damping: 38 * speed,
              mass: 1,
            },
      }}
    >
      {item.content}
    </motion.li>
  );
});

const initialFiles = [
  { id: "button", name: "button.tsx", code: true },
  { id: "tokens", name: "tokens.css", code: true },
  { id: "readme", name: "README.md", code: false },
];

/** Animate keyed list changes while the host retains ownership of its content. */
export function AnimatedList({
  items,
  emptyState = "No items.",
  ariaLabel = "Items",
  className = "",
  style,
  speed: requestedSpeed = 1,
  radius = 12,
  replayKey = 0,
  preview = false,
}: AnimatedListProps) {
  const reduced = useMotionPreference();
  const speed = Number.isFinite(requestedSpeed)
    ? Math.max(0.1, Math.min(4, requestedSpeed))
    : 1;
  const demonstration = preview && items === undefined;
  const [files, setFiles] = useState(initialFiles);
  const [announcement, setAnnouncement] = useState("");
  const [height, setHeight] = useState<number | null>(null);
  const nextFile = useRef(1);
  const listRef = useRef<HTMLUListElement | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);
  const [appliedReplay, setAppliedReplay] = useState(replayKey);

  if (appliedReplay !== replayKey) {
    setAppliedReplay(replayKey);
    if (demonstration)
      setFiles((current) =>
        current.length > 1 ? [...current.slice(1), current[0]] : current,
      );
  }

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const nextHeight = list.getBoundingClientRect().height;
      setHeight((current) =>
        current !== null && Math.abs(current - nextHeight) < 0.5
          ? current
          : nextHeight,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const moveFocusFromExit = useCallback(
    (node: HTMLLIElement) => {
      if (!node.contains(document.activeElement)) return;
      const list = listRef.current;
      if (!list) return;
      const siblings = Array.from(list.children) as HTMLLIElement[];
      const index = siblings.indexOf(node);
      const available = (candidate: HTMLLIElement) =>
        candidate.hasAttribute("data-list-id") &&
        !candidate.hasAttribute("data-exiting");
      const next =
        siblings.slice(index + 1).find(available) ??
        siblings.slice(0, index).reverse().find(available);
      const target = demonstration
        ? (next?.querySelector<HTMLButtonElement>("[data-list-remove]") ??
          addButton.current)
        : (next ?? list);
      if (target?.getClientRects().length)
        target.focus({ preventScroll: true });
    },
    [demonstration],
  );

  function addFile() {
    if (files.length >= 4) return;
    const number = nextFile.current++;
    const name = `draft-${number}.md`;
    setFiles((current) => [
      ...current,
      { id: `draft-${number}`, name, code: false },
    ]);
    setAnnouncement(`${name} added to this preview.`);
  }

  function sortFiles() {
    setFiles((current) => {
      const ordered = [...current].sort((a, b) => a.name.localeCompare(b.name));
      const alreadyAscending = current.every(
        (file, index) => file.id === ordered[index].id,
      );
      return alreadyAscending ? ordered.reverse() : ordered;
    });
    setAnnouncement("File order changed in this preview.");
  }

  const visibleItems: readonly AnimatedListItem[] = demonstration
    ? files.map((file) => {
        const Icon = file.code ? FileCode2 : FileText;
        return {
          id: file.id,
          content: (
            <div className="bal-file">
              <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
              <span className="bal-file-name">{file.name}</span>
              <button
                type="button"
                className="bal-remove"
                data-list-remove
                aria-label={`Remove ${file.name}`}
                onClick={() => {
                  setFiles((current) =>
                    current.filter((item) => item.id !== file.id),
                  );
                  setAnnouncement(`${file.name} removed from this preview.`);
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ),
        };
      })
    : (items ?? []);

  return (
    <div
      className={`bal-root ${className}`}
      data-preview={preview}
      style={
        {
          "--bera-radius": `${Number.isFinite(radius) ? Math.max(0, Math.min(24, radius)) : 12}px`,
          ...style,
        } as CSSProperties
      }
    >
      {demonstration && (
        <div
          className="bal-toolbar"
          role="group"
          aria-label="Local file preview controls"
        >
          <button
            ref={addButton}
            type="button"
            className="bal-action"
            disabled={files.length >= 4}
            onClick={addFile}
          >
            <Plus size={14} aria-hidden="true" /> Add file
          </button>
          <button
            type="button"
            className="bal-action"
            disabled={files.length < 2}
            onClick={sortFiles}
          >
            Sort
          </button>
          <span className="bal-demo-label">Local preview</span>
        </div>
      )}
      <motion.div
        className="bal-frame"
        initial={false}
        animate={{ height: height ?? "auto" }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 460 * speed * speed,
                damping: 38 * speed,
                mass: 1,
              }
        }
      >
        <ul
          ref={listRef}
          className="bal-list"
          role="list"
          aria-label={demonstration ? "Files in this local preview" : ariaLabel}
          tabIndex={-1}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visibleItems.map((item, index) => (
              <ListRow
                key={`item:${item.id}`}
                item={item}
                index={index}
                speed={speed}
                replayKey={demonstration ? 0 : replayKey}
                onExitFocus={moveFocusFromExit}
              />
            ))}
            {!visibleItems.length && (
              <ListRow
                key="empty"
                item={{ id: "empty", content: emptyState }}
                index={0}
                speed={speed}
                replayKey={demonstration ? 0 : replayKey}
                onExitFocus={moveFocusFromExit}
                empty
              />
            )}
          </AnimatePresence>
        </ul>
      </motion.div>
      {demonstration && (
        <span className="bal-sr-only" role="status" aria-atomic="true">
          {announcement}
        </span>
      )}
    </div>
  );
}

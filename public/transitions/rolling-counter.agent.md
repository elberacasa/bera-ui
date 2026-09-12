# Integrate bera/ui: RollingCounter

Read the host project first. Bring this transition into the existing interface, preserving its fonts, colors, content, semantics, and real behavior.

Dependencies: React, motion/react, lucide-react. Import the matching CSS alongside the module. Keep only the selected export and its shared helpers. Remove the outer preview frame, helper captions, sample data, and demo controls where they are not part of the host interaction. Do not add another animation engine.

Connect actions and controlled props to real application state. StateButton without onAction is an explicitly labeled save simulation; ToastStack uses local demonstration notifications. Never claim a real action succeeded based only on a timer. Clipboard confirmation must follow a successful write.

Normal playback is speed=1. The speed and replayKey props are preview controls; replay must not repeat real side effects or steal focus. Preserve reduced motion, focus return, keyboard navigation, and interruption behavior. Validate on a narrow phone viewport and desktop.

Selected export: RollingCounter
Source group: selection

## React

```tsx
"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ArrowLeft, Check, Minus, Plus, Search, X } from "lucide-react";
import "./selection.css";

type PlaybackProps = {
  /** 1 is normal speed; 0.35 is slow motion. */
  speed?: number;
  /** Replays the interaction without changing or emitting a controlled value. */
  replayKey?: number;
};

function useTiming(speed: number) {
  const reduced = useReducedMotion();
  const rate = Math.max(0.1, speed);
  return useMemo(
    () => ({
      reduced,
      rate,
      settle: {
        type: "spring" as const,
        bounce: 0.14,
        duration: reduced ? 0 : 0.4 / rate,
      },
      fade: { duration: reduced ? 0 : 0.16 / rate },
      entrance: {
        duration: reduced ? 0 : 0.36 / rate,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
    [reduced, rate],
  );
}

export type SlidingTab = {
  value: string;
  label: string;
  content: ReactNode;
};

export type SlidingTabsProps = PlaybackProps & {
  items?: readonly SlidingTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
};

const notes = [
  { title: "Refine the details", time: "Just now", unread: true, saved: true },
  { title: "Keep it simple", time: "2 hours ago", unread: false, saved: true },
  {
    title: "Make room for focus",
    time: "Yesterday",
    unread: false,
    saved: false,
  },
];

function NoteList({ filter }: { filter: "all" | "unread" | "saved" }) {
  const visible = notes.filter((note) => filter === "all" || note[filter]);
  return (
    <div className="bs-note-list">
      {visible.map((note) => (
        <div className="bs-note" key={note.title}>
          <span
            className={`bs-note-dot${note.unread ? " bs-note-dot-unread" : ""}`}
          />
          <span className="bs-note-title">{note.title}</span>
          <span className="bs-note-time">{note.time}</span>
        </div>
      ))}
      <span className="bs-note-summary">
        {visible.length} {visible.length === 1 ? "note" : "notes"}
      </span>
    </div>
  );
}

const defaultTabs: readonly SlidingTab[] = [
  { value: "all", label: "All notes", content: <NoteList filter="all" /> },
  { value: "unread", label: "Unread", content: <NoteList filter="unread" /> },
  { value: "saved", label: "Saved", content: <NoteList filter="saved" /> },
];

/** Automatic-activation tabs: arrows wrap, Home/End jump, and Tab enters the panel. */
export function SlidingTabs({
  items = defaultTabs,
  value,
  defaultValue,
  onValueChange,
  ariaLabel = "Filter notes",
  speed = 1,
  replayKey = 0,
}: SlidingTabsProps) {
  const [localValue, setLocalValue] = useState(
    defaultValue ?? items[0]?.value ?? "",
  );
  const selected = value ?? localValue;
  const active = items.find((item) => item.value === selected) ?? items[0];
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const timing = useTiming(speed);
  const entrance = useAnimationControls();
  const previousReplay = useRef(replayKey);
  const [appliedReplay, setAppliedReplay] = useState(replayKey);

  if (appliedReplay !== replayKey) {
    setAppliedReplay(replayKey);
    if (value === undefined && items.length) {
      const index = items.findIndex((item) => item.value === active?.value);
      setLocalValue(items[(index + 1) % items.length].value);
    }
  }

  useEffect(() => {
    void entrance.start({ opacity: 1, y: 0, transition: timing.entrance });
  }, [entrance, timing.entrance]);

  useEffect(() => {
    if (previousReplay.current === replayKey) return;
    previousReplay.current = replayKey;
    if (value !== undefined) {
      // Animate the existing node: controlled panel content and focus survive replay.
      entrance.set({
        opacity: timing.reduced ? 1 : 0.35,
        y: timing.reduced ? 0 : 5,
      });
      void entrance.start({ opacity: 1, y: 0, transition: timing.entrance });
    }
  }, [replayKey, value, entrance, timing.entrance, timing.reduced]);

  const select = (next: string) => {
    if (next === active?.value) return;
    if (value === undefined) setLocalValue(next);
    onValueChange?.(next);
  };

  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    select(items[next].value);
    refs.current[next]?.focus();
  };

  if (!active) return null;

  return (
    <div className="bs-demo bs-tabs-demo">
      <LayoutGroup id={id}>
        <motion.div
          className="bs-tabs-body"
          initial={{
            opacity: timing.reduced ? 1 : 0,
            y: timing.reduced ? 0 : 5,
          }}
          animate={entrance}
          transition={timing.entrance}
        >
          <div className="bs-tablist" role="tablist" aria-label={ariaLabel}>
            {items.map((item, index) => {
              const isActive = item.value === active.value;
              return (
                <motion.button
                  key={item.value}
                  ref={(node) => {
                    refs.current[index] = node;
                  }}
                  className="bs-tab"
                  type="button"
                  role="tab"
                  id={`${id}-tab-${index}`}
                  aria-selected={isActive}
                  aria-controls={`${id}-panel-${index}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(item.value)}
                  onKeyDown={(event) => navigate(event, index)}
                  whileTap={timing.reduced ? undefined : { scale: 0.96 }}
                  transition={timing.settle}
                >
                  {isActive && (
                    <motion.span
                      className="bs-tab-pill"
                      layoutId="active-tab"
                      transition={timing.settle}
                    />
                  )}
                  <span className="bs-tab-label">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
          {items.map((item, index) => (
            <div
              key={item.value}
              id={`${id}-panel-${index}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${index}`}
              tabIndex={0}
              hidden={item.value !== active.value}
              className="bs-tab-panel"
            >
              {item.value === active.value && (
                <motion.div
                  key={item.value}
                  initial={{
                    opacity: timing.reduced ? 1 : 0,
                    y: timing.reduced ? 0 : 3,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={timing.fade}
                >
                  {item.content}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

const defaultSearchItems = ["Button", "Popover", "Tabs", "Search", "Counter"];

export type ExpandingSearchProps = PlaybackProps & {
  items?: readonly string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
};

/** A compact search that filters local items. Escape restores the trigger's focus. */
export function ExpandingSearch({
  items = defaultSearchItems,
  value,
  defaultValue = "",
  onValueChange,
  onSearch,
  placeholder = "Find a component…",
  speed = 1,
  replayKey = 0,
}: ExpandingSearchProps) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const query = value ?? localValue;
  const [open, setOpen] = useState(Boolean(query));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<"input" | "trigger" | null>(null);
  const previousReplay = useRef(replayKey);
  const [appliedReplay, setAppliedReplay] = useState(replayKey);
  const id = useId();
  const timing = useTiming(speed);
  const trimmed = query.trim();
  const results = items.filter((item) =>
    item.toLowerCase().includes(trimmed.toLowerCase()),
  );

  if (appliedReplay !== replayKey) {
    setAppliedReplay(replayKey);
    setOpen(!open);
  }

  useEffect(() => {
    const replayed = previousReplay.current !== replayKey;
    previousReplay.current = replayKey;
    if (!replayed && open && focusTarget.current === "input")
      inputRef.current?.focus({ preventScroll: true });
    else if (!replayed && !open && focusTarget.current === "trigger")
      triggerRef.current?.focus({ preventScroll: true });
    focusTarget.current = null;
  }, [open, replayKey]);

  const openSearch = () => {
    focusTarget.current = "input";
    setOpen(true);
  };
  const closeSearch = () => {
    focusTarget.current = "trigger";
    setOpen(false);
  };

  const change = (next: string) => {
    if (value === undefined) setLocalValue(next);
    onValueChange?.(next);
  };

  return (
    <div className="bs-demo bs-search-demo">
      <motion.div
        className="bs-search-stage"
        initial={false}
        animate={{ y: open ? -5 : 0 }}
        transition={timing.settle}
      >
        <motion.form
          className="bs-search-form"
          role="search"
          aria-label="Search components"
          initial={false}
          animate={{
            width: open ? 266 : 116,
            borderColor: open ? "#484848" : "#333",
          }}
          transition={timing.settle}
          onSubmit={(event) => {
            event.preventDefault();
            if (!open) openSearch();
            else onSearch?.(query);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              closeSearch();
            }
          }}
        >
          <motion.button
            ref={triggerRef}
            className="bs-search-trigger"
            style={{ width: open ? 40 : "100%" }}
            type={open ? "submit" : "button"}
            aria-label={open ? "Submit search" : "Open search"}
            aria-expanded={open}
            aria-controls={`${id}-search-input`}
            onClick={() => {
              if (!open) openSearch();
            }}
            whileTap={timing.reduced ? undefined : { scale: 0.94 }}
            transition={timing.settle}
          >
            <motion.span
              key={replayKey}
              className="bs-search-icon"
              initial={{
                rotate: timing.reduced ? 0 : -35,
                opacity: timing.reduced ? 1 : 0,
              }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={timing.settle}
            >
              <Search size={17} strokeWidth={1.8} />
            </motion.span>
          </motion.button>

          <AnimatePresence initial={false}>
            {!open && (
              <motion.span
                className="bs-search-label"
                aria-hidden="true"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: timing.reduced ? 0 : -5 }}
                transition={timing.fade}
              >
                Search
              </motion.span>
            )}
          </AnimatePresence>

          {open && (
            <>
              <motion.input
                ref={inputRef}
                id={`${id}-search-input`}
                className="bs-search-input"
                type="search"
                aria-label="Search components"
                aria-describedby={`${id}-search-results`}
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => change(event.target.value)}
                placeholder={placeholder}
                initial={{ opacity: timing.reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={timing.fade}
              />
              <motion.button
                className="bs-search-clear"
                type="button"
                aria-label={query ? "Clear search" : "Close search"}
                onClick={() => {
                  if (query) {
                    change("");
                    inputRef.current?.focus({ preventScroll: true });
                  } else closeSearch();
                }}
                initial={{ opacity: timing.reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                whileTap={timing.reduced ? undefined : { scale: 0.88 }}
                transition={timing.fade}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={query ? "clear" : "close"}
                    className="bs-search-clear-glyph"
                    initial={{
                      opacity: 0,
                      rotate: timing.reduced ? 0 : -65,
                      scale: timing.reduced ? 1 : 0.6,
                    }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      rotate: timing.reduced ? 0 : 65,
                      scale: timing.reduced ? 1 : 0.6,
                    }}
                    transition={timing.fade}
                  >
                    {query ? <X size={15} /> : <ArrowLeft size={15} />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </>
          )}
        </motion.form>

        <div
          className="bs-search-result-space"
          id={`${id}-search-results`}
          aria-live="polite"
          aria-atomic="true"
        >
          {open && trimmed ? (
            <motion.div
              className="bs-search-results"
              key={results.join("|") || "empty"}
              initial={{
                opacity: timing.reduced ? 1 : 0,
                y: timing.reduced ? 0 : 3,
              }}
              animate={{ opacity: 1, y: 0 }}
              transition={timing.fade}
            >
              <span className="bs-sr-only">{results.length} results.</span>
              {results.length ? (
                results.slice(0, 3).map((item) => (
                  <span className="bs-search-result" key={item}>
                    <Check size={11} />
                    {item}
                  </span>
                ))
              ) : (
                <span className="bs-search-hint">No components found.</span>
              )}
              {results.length > 3 && (
                <span className="bs-search-hint">+{results.length - 3}</span>
              )}
            </motion.div>
          ) : (
            <span className="bs-search-hint">
              {open
                ? `Search ${items.length} components`
                : "A little room to find things."}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export type RollingCounterProps = PlaybackProps & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
};

const clampCount = (count: number, min: number, max: number) =>
  Math.min(
    max,
    Math.max(min, Math.round(Number.isFinite(count) ? count : min)),
  );

/** Each decimal place animates independently. Rapid clicks continue from the current position. */
function RollingDigit({
  digit,
  direction,
  timing,
  replayKey,
}: {
  digit: number;
  direction: 1 | -1;
  timing: ReturnType<typeof useTiming>;
  replayKey: number;
}) {
  // Preserve the logical target across interruptions, then shift by whole runs
  // of ten. Rebasing preserves the visible fraction and never clamps to a wrong digit.
  const position = useMotionValue(-(20 + digit) * 58);
  const target = useRef(20 + digit);
  const previousDigit = useRef(digit);
  const previousReplay = useRef(replayKey);
  const { reduced, rate } = timing;

  useEffect(() => {
    const replay = previousReplay.current !== replayKey;
    const change =
      direction > 0
        ? (digit - previousDigit.current + 10) % 10
        : -((previousDigit.current - digit + 10) % 10);
    previousDigit.current = digit;
    previousReplay.current = replayKey;

    if (reduced) {
      position.set(-(20 + digit) * 58);
      target.current = 20 + digit;
      return;
    }

    let velocity = position.getVelocity();
    if (replay) {
      position.set(-(19 + digit) * 58);
      target.current = 20 + digit;
      velocity = 0;
    } else target.current += change;

    const current = -position.get() / 58;
    const distance = target.current - current;
    // If input outruns the spring, skip complete revolutions rather than queue them.
    if (distance > 10) target.current -= (Math.ceil(distance / 10) - 1) * 10;
    else if (distance < -10)
      target.current += (Math.ceil(-distance / 10) - 1) * 10;
    const shift = Math.floor(current / 10) * 10 - 20;
    target.current -= shift;
    position.set(-(current - shift) * 58);

    const animation = animate(position, -target.current * 58, {
      type: "spring",
      bounce: 0.1,
      duration: 0.38 / rate,
      velocity,
      onComplete: () => {
        position.set(-(20 + digit) * 58);
        target.current = 20 + digit;
      },
    });
    return () => animation.stop();
  }, [digit, direction, replayKey, reduced, rate, position]);

  return (
    <span className="bs-digit-window">
      <motion.span className="bs-digit-strip" style={{ y: position }}>
        {Array.from({ length: 50 }, (_, number) => (
          <span className="bs-digit" key={number}>
            {number % 10}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function RollingCounter({
  value,
  defaultValue = 24,
  onValueChange,
  min = 0,
  max = 999,
  label = "Quantity",
  speed = 1,
  replayKey = 0,
}: RollingCounterProps) {
  const low = clampCount(min, 0, 999);
  const high = Math.max(low, clampCount(max, 0, 999));
  const [localValue, setLocalValue] = useState(() =>
    clampCount(defaultValue, low, high),
  );
  const count = clampCount(value ?? localValue, low, high);
  const [movement, setMovement] = useState<{
    count: number;
    direction: 1 | -1;
  }>({ count, direction: 1 });
  // Derive direction from the whole count, including externally controlled jumps.
  const direction =
    count === movement.count
      ? movement.direction
      : count > movement.count
        ? 1
        : -1;
  if (count !== movement.count) setMovement({ count, direction });
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  const timing = useTiming(speed);
  const id = useId();
  const digits = String(count).padStart(3, "0").split("").map(Number);

  const update = (delta: number) => {
    const next = clampCount(countRef.current + delta, low, high);
    if (next === countRef.current) return;
    // Keep repeated events correct even before React commits the next frame.
    if (value === undefined) {
      countRef.current = next;
      setLocalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <div className="bs-demo bs-counter-demo">
      <div className="bs-counter-label" id={`${id}-label`}>
        {label}
      </div>
      <div
        className="bs-counter-control"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <motion.button
          type="button"
          className="bs-counter-button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={count <= low}
          onClick={() => update(-1)}
          whileTap={timing.reduced ? undefined : { scale: 0.89 }}
          transition={timing.settle}
        >
          <Minus size={17} strokeWidth={1.8} />
        </motion.button>
        <div className="bs-counter-value">
          <output className="bs-sr-only" aria-live="polite" aria-atomic="true">
            {count}
          </output>
          <div className="bs-counter-digits" aria-hidden="true">
            {digits.map((digit, index) => (
              <span
                className={
                  index < 2 && count < 10 ** (2 - index)
                    ? "bs-digit-place bs-digit-muted"
                    : "bs-digit-place"
                }
                key={index}
              >
                <RollingDigit
                  digit={digit}
                  direction={direction}
                  timing={timing}
                  replayKey={replayKey}
                />
              </span>
            ))}
          </div>
        </div>
        <motion.button
          type="button"
          className="bs-counter-button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={count >= high}
          onClick={() => update(1)}
          whileTap={timing.reduced ? undefined : { scale: 0.89 }}
          transition={timing.settle}
        >
          <Plus size={17} strokeWidth={1.8} />
        </motion.button>
      </div>
      <span className="bs-counter-hint">Every little increment.</span>
    </div>
  );
}

```

## CSS

```css
.bs-demo {
  --bs-text: #ececec;
  --bs-muted: #888;
  --bs-surface: #1a1a1a;
  --bs-border: #333;
  box-sizing: border-box;
  width: 100%;
  min-height: 230px;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bs-text);
  font-family: inherit;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

.bs-demo *,
.bs-demo *::before,
.bs-demo *::after {
  box-sizing: border-box;
}
.bs-demo button,
.bs-demo input {
  font: inherit;
}
.bs-demo button {
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.bs-demo button:disabled {
  cursor: default;
}
.bs-demo button:focus-visible,
.bs-tab-panel:focus-visible {
  outline: 2px solid #ececec;
  outline-offset: 4px;
}
.bs-sr-only {
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

.bs-tabs-body {
  width: 280px;
  max-width: 100%;
}
.bs-tablist {
  display: flex;
  gap: 3px;
  width: 100%;
  padding: 4px;
  border: 1px solid #242424;
  border-radius: 13px;
  background: #111;
}
.bs-tab {
  position: relative;
  isolation: isolate;
  flex: 1 1 0;
  min-width: 0;
  min-height: 36px;
  padding: 0 8px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--bs-muted);
  font-size: 12px !important;
  line-height: 1;
  white-space: nowrap;
  transition: color 150ms;
}
.bs-tab:hover {
  color: #ccc;
}
.bs-tab[aria-selected="true"] {
  color: var(--bs-text);
}
.bs-tab-pill {
  position: absolute;
  z-index: -1;
  inset: 0;
  border: 1px solid #373737;
  border-radius: 9px;
  background: #282828;
  box-shadow:
    0 1px 3px #0004,
    inset 0 1px 0 #ffffff06;
}
.bs-tab-label {
  position: relative;
}
.bs-tab-panel {
  min-height: 116px;
  padding: 15px 3px 0;
  border-radius: 6px;
}
.bs-tab-panel[hidden] {
  display: none;
}
.bs-note-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.bs-note {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 27px;
}
.bs-note-dot {
  flex: 0 0 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #383838;
}
.bs-note-dot-unread {
  background: #d3d3d3;
}
.bs-note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #bbb;
}
.bs-note-time {
  margin-left: auto;
  font-size: 9px;
  color: #777;
  white-space: nowrap;
}
.bs-note-summary {
  margin-top: 10px;
  padding-left: 12px;
  color: #777;
  font-size: 10px;
}

.bs-search-stage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36px;
}
.bs-search-form {
  position: relative;
  max-width: 100%;
  height: 44px;
  border: 1px solid var(--bs-border);
  border-radius: 12px;
  background: var(--bs-surface);
  box-shadow:
    0 2px 4px #0002,
    inset 0 1px 0 #ffffff03;
}
.bs-search-form:focus-within {
  box-shadow: 0 0 0 2px #bcbcbc;
}
.bs-search-trigger {
  position: absolute;
  top: 0;
  left: 0;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #bbb;
}
.bs-search-trigger:hover {
  color: #ececec;
}
.bs-search-icon {
  position: absolute;
  left: 13px;
  top: 12px;
  display: flex;
}
.bs-search-label {
  position: absolute;
  top: 13px;
  left: 40px;
  line-height: 16px;
  pointer-events: none;
}
.bs-search-input {
  position: absolute;
  top: 0;
  left: 40px;
  width: calc(100% - 80px);
  min-width: 0;
  height: 42px;
  padding: 0;
  outline: 0;
  border: 0;
  background: transparent;
  color: var(--bs-text);
  font-size: 12px !important;
  caret-color: #ececec;
}
.bs-search-input::placeholder {
  color: #777;
}
.bs-search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.bs-search-clear {
  position: absolute;
  top: 3px;
  right: 3px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: #888;
  background: transparent;
  transition:
    color 150ms,
    background 150ms;
}
.bs-search-clear:hover {
  color: #ececec;
  background: #ffffff06;
}
.bs-search-clear-glyph {
  display: grid;
  place-items: center;
}
.bs-search-result-space {
  width: 100%;
  min-height: 45px;
  padding-top: 16px;
  text-align: center;
}
.bs-search-hint {
  color: #777;
  font-size: 10px;
  line-height: 19px;
}
.bs-search-results {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  justify-content: center;
}
.bs-search-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid #292929;
  border-radius: 5px;
  color: #bbb;
  font-size: 10px;
  line-height: 17px;
}
.bs-search-result svg {
  color: #888;
}

.bs-counter-demo {
  flex-direction: column;
  gap: 14px;
}
.bs-counter-label {
  color: #888;
  font-size: 11px;
  line-height: 16px;
}
.bs-counter-control {
  display: flex;
  align-items: center;
  gap: 18px;
}
.bs-counter-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--bs-border);
  border-radius: 50%;
  color: #bbb;
  background: var(--bs-surface);
  box-shadow: inset 0 1px 0 #ffffff03;
  transition:
    color 150ms,
    border-color 150ms,
    background 150ms,
    opacity 150ms;
}
.bs-counter-button:hover:not(:disabled) {
  color: #fff;
  background: #232323;
  border-color: #484848;
}
.bs-counter-button:disabled {
  opacity: 0.3;
}
.bs-counter-value {
  position: relative;
}
.bs-counter-digits {
  display: flex;
  font-size: 48px;
  line-height: 1;
  font-weight: 450;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}
.bs-digit-place {
  width: 30px;
  transition: color 180ms;
}
.bs-digit-muted {
  color: #373737;
}
.bs-digit-window {
  display: block;
  height: 58px;
  overflow: hidden;
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.bs-digit-strip {
  display: flex;
  flex-direction: column;
  height: 2900px;
  will-change: transform;
}
.bs-digit {
  flex: 0 0 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bs-counter-hint {
  margin-top: 0;
  color: #777;
  font-size: 10px;
  line-height: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .bs-demo *,
  .bs-demo *::before,
  .bs-demo *::after {
    transition-duration: 0s !important;
  }
}

@media (pointer: coarse) {
  .bs-search-input {
    font-size: 16px !important;
  }
}

```

"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  Check,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Pin,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import "./surfaces.css";

export interface SurfaceMotionProps {
  preview?: boolean;
  radius?: number;
  className?: string;
  style?: CSSProperties;
  /** Playback rate: 1 is normal; .35 is slow motion. */
  speed?: number;
  /** Change this value to exercise the next transition. */
  replayKey?: number;
}

export interface MorphingMenuAction {
  label: string;
  /** Render an icon, for example <Copy size={15} />. */
  icon?: ReactNode;
  onSelect: () => void;
  /** Supplying a boolean makes this action an accessible checked menu item. */
  checked?: boolean;
}

export interface MorphingMenuProps extends SurfaceMotionProps {
  label?: string;
  actions?: readonly MorphingMenuAction[];
}

function useSurfaceMotion(speed: number) {
  const reduced = useReducedMotion();
  const rate = Number.isFinite(speed) ? Math.max(0.15, speed) : 1;
  return {
    reduced,
    rate,
    spring: reduced
      ? { duration: 0 }
      : {
          type: "spring" as const,
          stiffness: 470 * rate * rate,
          damping: 34 * rate,
          mass: 0.9,
        },
    fade: (duration = 0.14, delay = 0) => ({
      duration: reduced ? 0 : duration / rate,
      delay: reduced ? 0 : delay / rate,
      ease: "easeOut" as const,
    }),
  };
}

/**
 * One physical surface expands around its fixed bottom-right corner.
 * Width/height animate directly; the content never inherits a scale transform.
 * Arrow keys navigate; Escape restores focus; Tab leaves the menu normally.
 */
export function MorphingMenu({
  speed = 1,
  radius = 12,
  preview = false,
  className = "",
  style,
  replayKey = 0,
  label = "Actions",
  actions: suppliedActions,
}: MorphingMenuProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [activeItem, setActiveItem] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const focusOnOpen = useRef(false);
  const firstItem = useRef(0);
  const previousReplay = useRef(replayKey);
  const focusFrame = useRef<number | null>(null);
  const menuId = useId();
  const { reduced, rate, spring, fade } = useSurfaceMotion(speed);

  function closeMenu(restoreFocus = true) {
    // Remove departing items from navigation immediately, before Tab's default action.
    if (contentRef.current) contentRef.current.inert = true;
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function focusItem(index: number) {
    setActiveItem(index);
    itemsRef.current[index]?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (previousReplay.current === replayKey) return;
    previousReplay.current = replayKey;
    focusOnOpen.current = false;
    setOpen((current) => !current);
  }, [replayKey]);

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      focusFrame.current = requestAnimationFrame(() => {
        setActiveItem(firstItem.current);
        itemsRef.current[firstItem.current]?.focus({ preventScroll: true });
      });
    }
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !frameRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", dismissOutside);
    return () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      document.removeEventListener("pointerdown", dismissOutside);
    };
  }, [open]);

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (event.key === "Tab") {
      // Move the tab starting point back to the trigger before normal navigation.
      closeMenu();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!actions.length) return;
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? actions.length - 1
            : (activeItem +
                (event.key === "ArrowDown" ? 1 : -1) +
                actions.length) %
              actions.length;
      focusItem(next);
    }
  }

  async function copyLabel() {
    try {
      await navigator.clipboard.writeText("MorphingMenu");
      setFeedback("Component name copied");
    } catch {
      setFeedback("Clipboard unavailable in this browser");
    }
  }

  const actions: readonly MorphingMenuAction[] = suppliedActions ?? [
    {
      label: "Copy component name",
      icon: <Copy size={15} />,
      onSelect: copyLabel,
    },
    {
      label: pinned ? "Unpin preview" : "Pin preview",
      icon: <Pin size={15} />,
      checked: pinned,
      onSelect: () => {
        setPinned((current) => !current);
        setFeedback(pinned ? "Preview unpinned" : "Preview pinned");
      },
    },
    {
      label: "Reset preview",
      icon: <RotateCcw size={15} />,
      onSelect: () => {
        setPinned(false);
        setFeedback("Preview reset");
      },
    },
  ];
  const menuLabel = label === "Actions" ? "Quick actions" : label;

  return (
    <div
      data-preview={preview}
      className={`bt-surface-demo bt-morph-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
      {pinned ? (
        <span className="bt-pin-indicator">
          <Pin size={12} aria-hidden="true" /> Pinned
        </span>
      ) : null}
      <motion.div
        ref={frameRef}
        className="bt-morph-surface"
        initial={false}
        animate={{
          width: open ? 238 : 122,
          height: open ? 53 + Math.min(actions.length, 3) * 45 : 44,
          borderRadius: Math.max(0, Math.min(24, radius)),
        }}
        transition={spring}
        onBlur={(event) => {
          if (
            open &&
            event.relatedTarget instanceof Node &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            closeMenu(false);
        }}
      >
        <motion.button
          ref={triggerRef}
          type="button"
          className="bt-morph-trigger"
          aria-label={menuLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={actions.length === 0}
          tabIndex={open ? -1 : 0}
          initial={false}
          animate={{ opacity: open ? 0 : 1, y: reduced ? 0 : open ? 5 : 0 }}
          transition={fade(open ? 0.07 : 0.12, open ? 0 : 0.08)}
          style={{ pointerEvents: open ? "none" : "auto" }}
          onClick={() => {
            focusOnOpen.current = true;
            firstItem.current = 0;
            setOpen((current) => !current);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              focusOnOpen.current = true;
              firstItem.current =
                event.key === "ArrowUp" ? actions.length - 1 : 0;
              setOpen(true);
            }
          }}
        >
          <MoreHorizontal size={17} aria-hidden="true" />
          <span>{label}</span>
        </motion.button>
        <motion.div
          ref={contentRef}
          className="bt-morph-content"
          aria-hidden={!open}
          inert={!open}
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={fade(open ? 0.1 : 0.06, open ? 0.06 : 0)}
          style={{ pointerEvents: open ? "auto" : "none" }}
          onKeyDown={handleMenuKey}
        >
          <div className="bt-menu-heading">
            <span>{menuLabel}</span>
            <button
              type="button"
              className="bt-menu-close"
              aria-label={`Close ${menuLabel}`}
              tabIndex={-1}
              onClick={() => closeMenu()}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <div
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            className="bt-menu-items"
          >
            {actions.map(
              ({ label: actionLabel, icon, onSelect, checked }, index) => (
                <motion.button
                  key={index}
                  ref={(element) => {
                    itemsRef.current[index] = element;
                  }}
                  type="button"
                  role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
                  aria-checked={checked}
                  tabIndex={open && activeItem === index ? 0 : -1}
                  className="bt-menu-item"
                  initial={false}
                  animate={{
                    opacity: open ? 1 : 0,
                    y: reduced || open ? 0 : 7,
                  }}
                  transition={{
                    ...spring,
                    opacity: fade(
                      open ? 0.13 : 0.05,
                      open ? 0.075 + index * 0.028 : 0,
                    ),
                    delay:
                      reduced || !open ? 0 : (0.065 + index * 0.025) / rate,
                  }}
                  onFocus={() => setActiveItem(index)}
                  onClick={() => {
                    closeMenu();
                    onSelect();
                  }}
                >
                  {icon ? (
                    <span className="bt-menu-action-icon" aria-hidden="true">
                      {icon}
                    </span>
                  ) : null}
                  <span>{actionLabel}</span>
                  {checked ? (
                    <Check
                      size={13}
                      className="bt-menu-checked"
                      aria-hidden="true"
                    />
                  ) : null}
                </motion.button>
              ),
            )}
          </div>
        </motion.div>
      </motion.div>
      <span className="bt-demo-feedback" role="status" aria-live="polite">
        {feedback}
      </span>
    </div>
  );
}

const accordionItems = [
  {
    title: "Can I use this in my project?",
    body: "Yes. Copy the component and its styles, then make it your own.",
  },
  {
    title: "Does it work with a keyboard?",
    body: "Tab to a heading. Press Enter or Space to open and close it.",
  },
  {
    title: "Can I change the motion?",
    body: "Set the speed to suit your interface. Reduced motion is respected automatically.",
  },
];

export interface AccordionItem {
  title: string;
  body: ReactNode;
}

export interface AccordionProps extends SurfaceMotionProps {
  items?: readonly AccordionItem[];
  /** The open item index, or null for all closed. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
}

/** Intrinsic content height keeps text unscaled, including during reversals. */
export function Accordion({
  speed = 1,
  radius = 12,
  preview = false,
  className = "",
  style,
  replayKey = 0,
  items = accordionItems,
  value,
  defaultValue = 0,
  onValueChange,
}: AccordionProps) {
  const [internalValue, setInternalValue] = useState<number | null>(
    defaultValue,
  );
  const expanded = value === undefined ? internalValue : value;
  const [previousReplay, setPreviousReplay] = useState(replayKey);
  const id = useId();
  const { reduced, spring, fade } = useSurfaceMotion(speed);

  // Gallery replay only adjusts local state. Controlled values belong to the caller.
  if (previousReplay !== replayKey) {
    setPreviousReplay(replayKey);
    if (value === undefined) {
      setInternalValue(
        items.length === 0
          ? null
          : internalValue === null
            ? 0
            : (internalValue + 1) % items.length,
      );
    }
  }

  return (
    <div
      data-preview={preview}
      className={`bt-surface-demo bt-accordion-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="bt-accordion">
        {items.map((item, index) => {
          const isOpen = expanded === index;
          const triggerId = `${id}-trigger-${index}`;
          const panelId = `${id}-panel-${index}`;
          return (
            <div
              className="bt-accordion-item"
              key={item.title}
              data-open={isOpen}
            >
              <h3 className="bt-accordion-heading">
                <button
                  id={triggerId}
                  type="button"
                  className="bt-accordion-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    const next = expanded === index ? null : index;
                    if (value === undefined) setInternalValue(next);
                    onValueChange?.(next);
                  }}
                >
                  <span>{item.title}</span>
                  <motion.span
                    className="bt-disclosure"
                    initial={false}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={spring}
                  >
                    <ChevronDown size={15} aria-hidden="true" />
                  </motion.span>
                </button>
              </h3>
              <motion.div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className="bt-accordion-panel"
                initial={false}
                animate={{ height: isOpen ? "auto" : 0 }}
                transition={spring}
              >
                <motion.div
                  className="bt-accordion-body"
                  initial={false}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    y: reduced ? 0 : isOpen ? 0 : -5,
                  }}
                  transition={{
                    ...spring,
                    opacity: fade(isOpen ? 0.18 : 0.1, isOpen ? 0.045 : 0),
                  }}
                >
                  {item.body}
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PreviewToast = { id: number; title: string; description: ReactNode };

export interface ToastStackProps extends SurfaceMotionProps {
  /** New notifications capture these values when added, preserving older content. */
  title?: string;
  description?: ReactNode;
}

/** Local preview notifications. The newest is on top; dismiss reveals the next. */
export function ToastStack({
  speed = 1,
  radius = 12,
  preview = false,
  className = "",
  style,
  replayKey = 0,
  title = "Preview notification",
  description = "Created locally in this demo.",
}: ToastStackProps) {
  const [toasts, setToasts] = useState<PreviewToast[]>(() => [
    { id: 1, title, description },
  ]);
  const [announcement, setAnnouncement] = useState("");
  const counter = useRef(1);
  const previousReplay = useRef(replayKey);
  const previewButton = useRef<HTMLButtonElement>(null);
  const dismissButtons = useRef(new Map<number, HTMLButtonElement>());
  const focusFrame = useRef<number | null>(null);
  const { reduced, spring, fade } = useSurfaceMotion(speed);

  function addToast() {
    const id = ++counter.current;
    setToasts((current) =>
      [{ id, title, description }, ...current].slice(0, 3),
    );
    setAnnouncement(`Notification ${id}: ${title}.`);
  }

  function dismissToast(id: number) {
    const wasFocused =
      document.activeElement === dismissButtons.current.get(id);
    const remaining = toasts.filter((toast) => toast.id !== id);
    setToasts(remaining);
    setAnnouncement(
      remaining.length
        ? `Notification dismissed. ${remaining.length} remaining.`
        : "All preview notifications dismissed.",
    );
    if (wasFocused) {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      focusFrame.current = requestAnimationFrame(() => {
        const nextButton = remaining[0]
          ? dismissButtons.current.get(remaining[0].id)
          : null;
        (nextButton ?? previewButton.current)?.focus({ preventScroll: true });
      });
    }
  }

  useEffect(() => {
    if (previousReplay.current === replayKey) return;
    previousReplay.current = replayKey;
    const id = ++counter.current;
    setToasts((current) =>
      [{ id, title, description }, ...current].slice(0, 3),
    );
    setAnnouncement(`Notification ${id}: ${title}.`);
  }, [replayKey, title, description]);

  useEffect(
    () => () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    },
    [],
  );

  return (
    <div
      data-preview={preview}
      className={`bt-surface-demo bt-toast-preview ${className}`}
      style={
        {
          "--bera-radius": `${Math.max(0, Math.min(24, radius))}px`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="bt-toast-position">
        <AnimatePresence initial={false}>
          {!toasts.length ? (
            <motion.div
              key="empty"
              className="bt-toast-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade()}
            >
              <Bell size={19} aria-hidden="true" />
              <span>No notifications</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <ol className="bt-toast-list" aria-label="Preview notifications">
          <AnimatePresence initial={false}>
            {toasts.map((toast, index) => (
              <motion.li
                key={toast.id}
                className="bt-toast"
                aria-hidden={index > 0}
                inert={index > 0}
                initial={{
                  opacity: 0,
                  y: reduced ? 0 : 25,
                  scale: reduced ? 1 : 0.98,
                }}
                animate={{
                  opacity: 1 - index * 0.17,
                  y: index * -11,
                  scale: 1 - index * 0.045,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: reduced ? 0 : 38,
                  transition: fade(0.15),
                }}
                transition={{ ...spring, opacity: fade(0.16) }}
                style={{
                  zIndex: 3 - index,
                  pointerEvents: index === 0 ? "auto" : "none",
                  transformOrigin: "50% 0%",
                }}
              >
                <span className="bt-toast-icon">
                  <Bell size={15} aria-hidden="true" />
                </span>
                <div className="bt-toast-copy">
                  <span className="bt-toast-title">
                    {toast.title}{" "}
                    {toast.title === "Preview notification" ? (
                      <span className="bt-toast-number">{toast.id}</span>
                    ) : null}
                  </span>
                  <span className="bt-toast-description">
                    {toast.description}
                  </span>
                </div>
                <button
                  ref={(element) => {
                    if (element) dismissButtons.current.set(toast.id, element);
                    else dismissButtons.current.delete(toast.id);
                  }}
                  type="button"
                  className="bt-toast-dismiss"
                  aria-label={`Dismiss ${toast.title} ${toast.id}`}
                  tabIndex={index === 0 ? 0 : -1}
                  onClick={() => dismissToast(toast.id)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>
      <motion.button
        ref={previewButton}
        type="button"
        className="bt-toast-add"
        whileTap={reduced ? undefined : { y: 1, scale: 0.98 }}
        transition={spring}
        onClick={addToast}
      >
        <Plus size={15} aria-hidden="true" />
        Preview toast
      </motion.button>
      <span
        className="bt-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </span>
    </div>
  );
}

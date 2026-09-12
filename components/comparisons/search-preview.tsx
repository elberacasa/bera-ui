"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Search, X } from "lucide-react";
import { ExpandingSearch } from "../transitions/selection";
import catalog from "../../lib/transition-catalog.json";
import "./search-preview.css";

export type SearchComparisonPreviewProps = {
  enhanced: boolean;
  speed: number;
  replayKey: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
};

const items = catalog.map((entry) => entry.name);

/** Native markup matching the recipe's dimensions, controls, and local results. */
function InstantSearch({
  open,
  onOpenChange,
  value,
  onValueChange,
}: Pick<
  SearchComparisonPreviewProps,
  "open" | "onOpenChange" | "value" | "onValueChange"
>) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<"input" | "trigger" | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const keyboard = useRef(true);
  const [focusVisible, setFocusVisible] = useState(false);
  const trimmed = value.trim();
  const results = items.filter((item) =>
    item.toLowerCase().includes(trimmed.toLowerCase()),
  );

  useEffect(() => {
    const pointer = () => {
      keyboard.current = false;
      setFocusVisible(false);
    };
    const key = (event: KeyboardEvent) => {
      if (["Tab", "Enter", " "].includes(event.key)) keyboard.current = true;
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);

  useEffect(() => {
    const target =
      open && focusTarget.current === "input"
        ? input.current
        : !open && focusTarget.current === "trigger"
          ? trigger.current
          : null;
    if (target?.getClientRects().length) target.focus({ preventScroll: true });
    focusTarget.current = null;
  }, [open, focusRequest]);

  const changeOpen = (next: boolean) => {
    focusTarget.current = next ? "input" : "trigger";
    setFocusRequest((request) => request + 1);
    onOpenChange(next);
  };

  return (
    <div
      className="bs-demo bs-search-demo"
      data-preview="false"
      style={{ "--bera-radius": "12px" } as CSSProperties}
    >
      <div
        className="bs-search-stage"
        style={{ transform: open ? "translateY(-5px)" : "none" }}
      >
        <form
          className="bs-search-form"
          data-open={open}
          data-keyboard-focus={focusVisible}
          onFocusCapture={() => setFocusVisible(keyboard.current)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setFocusVisible(false);
          }}
          style={{ width: open ? 266 : 116 }}
          role="search"
          aria-label="Search components"
          onSubmit={(event) => {
            event.preventDefault();
            if (!open) changeOpen(true);
          }}
          onKeyDown={(event) => {
            keyboard.current = true;
            setFocusVisible(true);
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              changeOpen(false);
            }
          }}
        >
          <button
            ref={trigger}
            className="bs-search-trigger"
            style={{ width: open ? 40 : "100%" }}
            type={open ? "submit" : "button"}
            aria-label={open ? "Submit search" : "Open search"}
            aria-expanded={open}
            aria-controls={`${id}-search-input`}
            onClick={(event) => {
              if (!open) {
                event.preventDefault();
                changeOpen(true);
              }
            }}
          >
            <span className="bs-search-icon">
              <Search size={17} strokeWidth={1.8} />
            </span>
          </button>
          {!open && (
            <span className="bs-search-label" aria-hidden="true">
              Search
            </span>
          )}
          {open && (
            <>
              <input
                ref={input}
                id={`${id}-search-input`}
                className="bs-search-input"
                type="search"
                aria-label="Search components"
                aria-describedby={`${id}-search-results`}
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder="Find a component…"
              />
              <button
                className="bs-search-clear"
                type="button"
                aria-label={value ? "Clear search" : "Close search"}
                onClick={() => {
                  if (value) {
                    onValueChange("");
                    input.current?.focus({ preventScroll: true });
                  } else changeOpen(false);
                }}
              >
                <span className="bs-search-clear-glyph">
                  {value ? <X size={15} /> : <ArrowLeft size={15} />}
                </span>
              </button>
            </>
          )}
        </form>
        <div className="bs-search-result-space" id={`${id}-search-results`}>
          {open && trimmed ? (
            <div className="bs-search-results">
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
            </div>
          ) : (
            <span className="bs-search-hint">
              {open
                ? `Search ${items.length} components`
                : "A little room to find things."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** One row-owned query and disclosure state; only the initiating preview focuses. */
export function SearchComparisonPreview(props: SearchComparisonPreviewProps) {
  return (
    <div className="bc-search-preview" data-enhanced={props.enhanced}>
      {props.enhanced ? (
        <ExpandingSearch
          items={items}
          open={props.open}
          onOpenChange={props.onOpenChange}
          value={props.value}
          onValueChange={props.onValueChange}
          speed={props.speed}
          replayKey={props.replayKey}
        />
      ) : (
        <InstantSearch {...props} />
      )}
    </div>
  );
}

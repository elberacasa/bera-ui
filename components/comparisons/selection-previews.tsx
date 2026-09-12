"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { FileCode2, FileText, Minus, Plus } from "lucide-react";
import {
  RollingCounter,
  SlidingTabs,
  type SlidingTab,
} from "@/components/transitions/selection";
import "./selection-previews.css";

export type TabsComparisonValue = "all" | "code" | "docs";

type ComparisonProps<Value> = {
  enhanced: boolean;
  speed: number;
  replayKey: number;
  value: Value;
  onValueChange: (value: Value) => void;
};

const projectFiles = [
  { name: "dropdown-menu.tsx", type: "React", category: "code" },
  { name: "radix-menu-motion.css", type: "CSS", category: "code" },
  { name: "README.md", type: "Markdown", category: "docs" },
] as const;

function ProjectFiles({ filter }: { filter: TabsComparisonValue }) {
  const visible = projectFiles.filter(
    (file) => filter === "all" || file.category === filter,
  );

  return (
    <div className="cx-file-panel">
      <ul className="cx-file-list" aria-label="Project files">
        {visible.map((file) => (
          <li className="cx-file" key={file.name}>
            {file.category === "code" ? (
              <FileCode2 size={14} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <FileText size={14} strokeWidth={1.5} aria-hidden="true" />
            )}
            <span className="cx-file-name">{file.name}</span>
            <span className="cx-file-type">{file.type}</span>
          </li>
        ))}
      </ul>
      <p className="cx-file-count">
        {visible.length} {visible.length === 1 ? "file" : "files"}
      </p>
    </div>
  );
}

export const comparisonTabs = [
  { value: "all", label: "All files", content: <ProjectFiles filter="all" /> },
  { value: "code", label: "Code", content: <ProjectFiles filter="code" /> },
  { value: "docs", label: "Docs", content: <ProjectFiles filter="docs" /> },
] satisfies readonly (SlidingTab & { value: TabsComparisonValue })[];

export const initialTabsComparisonValue: TabsComparisonValue = "all";
export const initialCounterComparisonValue = 8;

function InstantTabs({
  value,
  onValueChange,
}: Pick<ComparisonProps<TabsComparisonValue>, "value" | "onValueChange">) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: TabsComparisonValue) {
    if (next !== value) onValueChange(next);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % comparisonTabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + comparisonTabs.length) % comparisonTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = comparisonTabs.length - 1;
    else return;
    event.preventDefault();
    select(comparisonTabs[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className="bs-demo bs-tabs-demo cx-instant" data-preview="false">
      <div className="bs-tabs-body">
        <div
          className="bs-tablist"
          role="tablist"
          aria-label="Filter project files"
        >
          {comparisonTabs.map((item, index) => {
            const active = item.value === value;
            return (
              <button
                className="bs-tab"
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                key={item.value}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                aria-selected={active}
                aria-controls={`${id}-panel-${index}`}
                tabIndex={active ? 0 : -1}
                onClick={() => select(item.value)}
                onKeyDown={(event) => navigate(event, index)}
              >
                {active && <span className="bs-tab-pill" />}
                <span className="bs-tab-label">{item.label}</span>
              </button>
            );
          })}
        </div>
        {comparisonTabs.map((item, index) => (
          <div
            className="bs-tab-panel"
            role="tabpanel"
            id={`${id}-panel-${index}`}
            aria-labelledby={`${id}-tab-${index}`}
            tabIndex={0}
            hidden={item.value !== value}
            key={item.value}
          >
            {item.value === value && <div>{item.content}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabsComparisonPreview({
  enhanced,
  speed,
  replayKey,
  value,
  onValueChange,
}: ComparisonProps<TabsComparisonValue>) {
  return (
    <div className="cx-demo cx-selection cx-tabs">
      {enhanced ? (
        <SlidingTabs
          items={comparisonTabs}
          value={value}
          onValueChange={(next) => {
            if (next === "all" || next === "code" || next === "docs")
              onValueChange(next);
          }}
          ariaLabel="Filter project files"
          speed={speed}
          replayKey={replayKey}
        />
      ) : (
        <InstantTabs value={value} onValueChange={onValueChange} />
      )}
    </div>
  );
}

function InstantCounter({
  value,
  onValueChange,
}: Pick<ComparisonProps<number>, "value" | "onValueChange">) {
  const id = useId();
  const digits = String(value).padStart(3, "0").split("");

  return (
    <div className="bs-demo bs-counter-demo cx-instant" data-preview="false">
      <div className="bs-counter-label" id={`${id}-label`}>
        Team seats
      </div>
      <div
        className="bs-counter-control"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <button
          className="bs-counter-button"
          type="button"
          aria-label="Decrease team seats"
          disabled={value <= 1}
          onClick={() => onValueChange(Math.max(1, value - 1))}
        >
          <Minus size={17} strokeWidth={1.8} />
        </button>
        <div className="bs-counter-value">
          <output className="bs-sr-only" aria-live="polite" aria-atomic="true">
            {value}
          </output>
          <div className="bs-counter-digits" aria-hidden="true">
            {digits.map((digit, index) => (
              <span
                className={
                  index < 2 && value < 10 ** (2 - index)
                    ? "bs-digit-place bs-digit-muted"
                    : "bs-digit-place"
                }
                key={index}
              >
                <span className="bs-digit-window">
                  <span className="bs-digit">{digit}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
        <button
          className="bs-counter-button"
          type="button"
          aria-label="Increase team seats"
          disabled={value >= 99}
          onClick={() => onValueChange(Math.min(99, value + 1))}
        >
          <Plus size={17} strokeWidth={1.8} />
        </button>
      </div>
      <span className="bs-counter-hint">Every little increment.</span>
    </div>
  );
}

export function CounterComparisonPreview({
  enhanced,
  speed,
  replayKey,
  value,
  onValueChange,
}: ComparisonProps<number>) {
  return (
    <div className="cx-demo cx-selection cx-counter">
      {enhanced ? (
        <RollingCounter
          label="Team seats"
          min={1}
          max={99}
          value={value}
          onValueChange={onValueChange}
          speed={speed}
          replayKey={replayKey}
        />
      ) : (
        <InstantCounter value={value} onValueChange={onValueChange} />
      )}
    </div>
  );
}

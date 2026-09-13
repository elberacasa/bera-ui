"use client";

import { useRef } from "react";
import { MotionConfig } from "motion/react";
import { FileCode2, FileText, X } from "lucide-react";
import { AnimatedList } from "../transitions/animated-list";
import "./list-preview.css";

const files = {
  brief: { name: "Project brief.md", kind: "Document", Icon: FileText },
  tokens: { name: "motion.tokens.ts", kind: "TypeScript", Icon: FileCode2 },
  readme: { name: "README.md", kind: "Document", Icon: FileText },
};
export type FileComparisonId = keyof typeof files;

export function ListComparisonPreview({
  enhanced,
  speed,
  order,
  onRemove,
}: {
  enhanced: boolean;
  speed: number;
  order: readonly FileComparisonId[];
  onRemove: (id: FileComparisonId) => void;
}) {
  const controls = useRef<Record<string, HTMLButtonElement | null>>({});
  const heading = useRef<HTMLDivElement>(null);
  const remove = (id: FileComparisonId) => {
    const index = order.indexOf(id);
    const neighbor = order[index + 1] ?? order[index - 1];
    (controls.current[neighbor] ?? heading.current)?.focus();
    onRemove(id);
  };
  return (
    <div className="bc-list-preview">
      <div className="bc-list-heading" ref={heading} tabIndex={-1}>
        <span>Project files</span>
        <span>{order.length} files</span>
      </div>
      {/* The instant side uses the same content and semantics with all motion disabled. */}
      <MotionConfig reducedMotion={enhanced ? "user" : "always"}>
        <AnimatedList
          ariaLabel="Project files"
          speed={speed}
          radius={10}
          emptyState={
            <p className="bc-list-empty">
              All files removed. Restore the list above.
            </p>
          }
          items={order.map((id) => {
            const file = files[id];
            return {
              id,
              content: (
                <div className="bc-list-file">
                  <file.Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                  <div>
                    <span>{file.name}</span>
                    <small>{file.kind}</small>
                  </div>
                  <button
                    type="button"
                    ref={(node) => {
                      controls.current[id] = node;
                    }}
                    onClick={() => remove(id)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ),
            };
          })}
        />
      </MotionConfig>
    </div>
  );
}

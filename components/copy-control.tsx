"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyControl({
  value,
  label = "Copy",
  disabled = false,
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<{
    value: string;
    status: "done" | "failed";
  } | null>(null);
  const status = result?.value === value ? result.status : "idle";
  const text =
    status === "done"
      ? "Copied"
      : status === "failed"
        ? "Select and copy the text"
        : label;
  return (
    <button
      type="button"
      className="tl-copy"
      disabled={disabled}
      aria-label={text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setResult({ value, status: "done" });
        } catch {
          setResult({ value, status: "failed" });
        }
      }}
    >
      {status === "done" ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      <span role="status">{text}</span>
    </button>
  );
}

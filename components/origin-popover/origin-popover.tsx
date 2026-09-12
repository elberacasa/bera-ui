"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "./origin-popover.css";

export type OriginPopoverProps = {
  /** An accessible button. Custom buttons must forward their ref. */
  trigger: ReactElement;
  /** A concise accessible name for the panel. */
  label: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Use for an in-app motion preference, in addition to the OS preference. */
  reduceMotion?: boolean;
  className?: string;
};

/** A shadcn popover with motion anchored to its collision-adjusted origin. */
export function OriginPopover({
  trigger,
  label,
  children,
  open,
  onOpenChange,
  defaultOpen = false,
  side = "bottom",
  align = "center",
  reduceMotion = false,
  className = "",
}: OriginPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={`origin-popover ${className}`}
        aria-label={label}
        side={side}
        align={align}
        sideOffset={9}
        collisionPadding={16}
        data-reduce-motion={reduceMotion || undefined}
      >
        <div className="origin-popover__content">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

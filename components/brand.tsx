"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const rest =
  "M4 3H8V8H13C17.7 8 20.5 10.6 20.5 14.5H16.8C16.8 12.8 15.3 11.5 13 11.5H8V18H13C15.3 18 16.8 16.8 16.8 16H20.5C20.5 19.4 17.7 21.5 13 21.5H4Z";
const open =
  "M4 3H8V8H13C17.7 8 20.5 9.6 20.5 13.5H16.8C16.8 11.8 15.3 11.5 13 11.5H8V18H13C15.3 18 16.8 17.8 16.8 17H20.5C20.5 20.4 17.7 21.5 13 21.5H4Z";

export function Brand() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  return (
    <Link
      href="/"
      className="tl-brand"
      aria-label="Bera UI home"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span>
        <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
          <motion.path
            fill="currentColor"
            d={rest}
            initial={false}
            animate={{ d: active ? open : rest }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 25 }
            }
          />
        </svg>
        <span className="tl-brand-name">
          bera<span className="tl-brand-ui">/ui</span>
        </span>
      </span>
    </Link>
  );
}

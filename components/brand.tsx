"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const aperture = {
  rest: "M23 14.5H34V14C34 11.24 31.76 9 29 9H28C25.24 9 23 11.24 23 14V15C23 17.76 25.24 20 28 20H29C30.3 20 31.5 19.6 32.5 18.8",
  open: "M23 14.5H33.4V14C33.4 11.24 31.76 9 29 9H28C25.24 9 23 11.24 23 14V15C23 17.76 25.24 20 28 20H29C30.3 20 31.9 19.3 33.2 18.3",
};

export function Brand() {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Link
      href="/"
      className="tl-brand"
      aria-label="Bera UI home"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <svg
        width="82"
        height="28"
        viewBox="0 0 72 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path data-part="b-stem" d="M4 3V20" />
        <path
          data-part="b-bowl"
          d="M4 14C4 11.24 6.24 9 9 9H10C12.76 9 15 11.24 15 14V15C15 17.76 12.76 20 10 20H9C6.24 20 4 17.76 4 15"
        />
        <motion.path
          data-part="e"
          d={aperture.rest}
          initial={false}
          animate={{ d: hovered || focused ? aperture.open : aperture.rest }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 320, damping: 28 }
          }
        />
        <path data-part="r" d="M42 20V9M42 14C42 10.8 44.2 9 47 9H49" />
        <path
          data-part="a"
          d="M67 20V9M67 14C67 11.24 64.76 9 62 9H61C58.24 9 56 11.24 56 14V15C56 17.76 58.24 20 61 20H62C64.76 20 67 17.76 67 15"
        />
      </svg>
    </Link>
  );
}

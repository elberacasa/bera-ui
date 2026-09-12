"use client";

import { useContext, useSyncExternalStore } from "react";
import { MotionConfigContext } from "motion/react";

const motionPreferenceQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotionPreference(notify: () => void) {
  const query = window.matchMedia(motionPreferenceQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function readMotionPreference() {
  return window.matchMedia(motionPreferenceQuery).matches;
}

/** Follow live user preference and any stronger host policy; render still on the server. */
export function useMotionPreference() {
  const preference = useSyncExternalStore(
    subscribeMotionPreference,
    readMotionPreference,
    () => true,
  );
  const { reducedMotion } = useContext(MotionConfigContext);
  return reducedMotion === "always" || preference;
}

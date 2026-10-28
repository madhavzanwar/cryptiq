"use client";

import { useSettings } from "@/lib/stores/settings";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True when the OS asks for reduced motion or the in-app override (Settings) is on. */
export function useReducedMotionPref(): boolean {
  const os = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const override = useSettings((s) => s.reduceMotion);
  return os || override;
}

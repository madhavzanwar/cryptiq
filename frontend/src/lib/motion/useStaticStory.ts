"use client";

import { useSettings } from "@/lib/stores/settings";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** The OS reduced-motion preference (false on the server, so server and first client render agree). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * True when the story must render as a static stacked layout (no pin, no scrub): the OS asks for reduced
 * motion, or the person switched "reduce motion" on in Settings. CSS covers the OS preference before hydration.
 */
export function useStaticStory(): boolean {
  const override = useSettings((s) => s.reduceMotion);
  return usePrefersReducedMotion() || override;
}

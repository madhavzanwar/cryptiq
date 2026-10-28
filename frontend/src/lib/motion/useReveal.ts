"use client";

import { useEffect, type RefObject } from "react";

/**
 * Adds the `in` class to every `[data-reveal]` element inside `ref` once it scrolls into view
 * (the reveal styles live in styles/motion.css). With reduced motion everything is shown at once.
 */
export function useReveal(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [ref]);
}

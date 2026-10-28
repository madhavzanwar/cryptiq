/** Small pure helpers shared by the scroll story. Easings are never linear (see MOTION.md). */
export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Progress of `p` inside the window [a, b], clamped to 0..1. */
export const seg = (p: number, a: number, b: number): number => clamp((p - a) / (b - a));

/** Ease in-out (cubic). */
export const eIO = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Ease out (cubic). */
export const eO = (t: number): number => 1 - Math.pow(1 - t, 3);
/** Ease out with a small overshoot (nodes pop, stickers burst). */
export const eOB = (t: number): number => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

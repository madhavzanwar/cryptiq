import { describe, expect, it } from "vitest";
import { clamp, eIO, eO, eOB, lerp, seg } from "../math";

describe("math helpers", () => {
  it("clamp and lerp", () => {
    expect(clamp(5)).toBe(1);
    expect(clamp(-3)).toBe(0);
    expect(clamp(7, 5, 9)).toBe(7);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });
  it("seg gives progress inside a window and clamps outside", () => {
    expect(seg(0.1, 0.2, 0.4)).toBe(0);
    expect(seg(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(seg(0.9, 0.2, 0.4)).toBe(1);
  });
  it("easings start at 0 and end at 1", () => {
    for (const f of [eIO, eO, eOB]) {
      expect(f(0)).toBeCloseTo(0, 5);
      expect(f(1)).toBeCloseTo(1, 5);
    }
    expect(eIO(0.5)).toBeCloseTo(0.5, 5);
  });
  it("eIO and eO never decrease; none of them is linear", () => {
    let a = 0;
    let b = 0;
    for (let i = 1; i <= 100; i++) {
      const t = i / 100;
      expect(eIO(t)).toBeGreaterThanOrEqual(a);
      expect(eO(t)).toBeGreaterThanOrEqual(b);
      a = eIO(t);
      b = eO(t);
    }
    expect(eIO(0.25)).not.toBeCloseTo(0.25, 2);
    expect(eO(0.25)).not.toBeCloseTo(0.25, 2);
  });
  it("eOB overshoots a little before settling (nodes pop)", () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => eOB(i / 100)));
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.3);
  });
});

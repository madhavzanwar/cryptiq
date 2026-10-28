import { describe, expect, it } from "vitest";
import { CARDS, RANGES, initStory, scenes } from "../story";

const sweep = Array.from({ length: 201 }, (_, i) => i / 200);

describe("story timeline", () => {
  it("every window is ordered and inside 0..1", () => {
    for (const [name, [a, b]] of Object.entries(RANGES)) {
      expect(a, name).toBeLessThan(b);
      expect(a, name).toBeGreaterThanOrEqual(0);
      expect(b, name).toBeLessThanOrEqual(1);
    }
    for (const c of CARDS) for (const [a, b] of [c.enter, c.col, c.rin, c.rout]) expect(a).toBeLessThan(b);
  });

  it("starts and ends on the hero with the green pill full size (the story loops)", () => {
    const first = scenes(0);
    const last = scenes(1);
    expect(first.hero).toBe(1);
    expect(last.hero).toBe(1);
    expect(first.dock).toBe(0);
    expect(last.dock).toBe(0);
    expect(first.rise).toBe(0);
    expect(last.deviceExit).toBe(1);
    expect(last.bg).toBeCloseTo(0, 5);
  });

  it("hero is gone and the pill is docked mid-story", () => {
    const mid = scenes(0.5);
    expect(mid.hero).toBe(0);
    expect(mid.dock).toBe(1);
  });

  it("device screens hand over in order: voice, then result, then proof", () => {
    expect(scenes(0.35).screens[0]).toBeGreaterThan(0.95);
    expect(scenes(0.35).screens[1]).toBe(0);
    expect(scenes(0.49).screens[1]).toBeGreaterThan(0.95);
    expect(scenes(0.49).screens[0]).toBe(0);
    expect(scenes(0.62).screens[2]).toBe(1);
    expect(scenes(0.62).screens[1]).toBe(0);
  });

  it("cards enter and collapse in sequence; each right text is visible only in its own window", () => {
    expect(scenes(0.3).cards[0].enter).toBe(1);
    expect(scenes(0.3).cards[1].enter).toBe(0);
    expect(scenes(0.45).cards[0].collapse).toBe(1);
    expect(scenes(0.6).cards[1].collapse).toBe(1);
    expect(scenes(0.35).cards[0].textVisible).toBeGreaterThan(0.95);
    expect(scenes(0.35).cards[1].textVisible).toBe(0);
  });

  it("wheel list, statement and end cards appear in their scenes", () => {
    expect(scenes(0.75).wheel.visible).toBeGreaterThan(0.95);
    expect(scenes(0.5).wheel.visible).toBe(0);
    expect(scenes(0.85).statement.visible).toBeGreaterThan(0.95);
    expect(scenes(0.92).end.card1).toBeGreaterThan(0.5);
    expect(scenes(0.95).end.card2).toBeGreaterThan(0.95);
  });

  it("every numeric value stays finite and the 0..1 ones stay in range across the whole scroll", () => {
    for (const p of sweep) {
      const s = scenes(p);
      const unit = [s.bg / 0.7, s.hero, s.dock, s.rise, s.deviceExit, s.collapse, s.stickersExit, ...s.screens, s.typedFraction, s.tapMove, s.tapPress, s.score, s.list, s.attest, s.chipsOut, s.wheel.visible, s.wheel.roll, s.wheel.search, s.statement.visible, s.statement.lift, s.end.card1, s.end.card2, ...s.cards.flatMap((c) => [c.enter, c.collapse, c.textVisible])];
      for (const v of unit) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(-1e-9);
        expect(v).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
});

describe("initStory", () => {
  it("leaves incomplete markup alone and returns a harmless cleanup", () => {
    const cleanup = initStory(document.createElement("div"));
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { messages, translate } from "@/lib/i18n";

describe("i18n", () => {
  it("English and Hindi expose exactly the same keys", () => {
    expect(Object.keys(messages.hi).sort()).toEqual(Object.keys(messages.en).sort());
  });
  it("every Hindi message is non-empty and keeps its {placeholders}", () => {
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      const en = messages.en[key];
      const hi = messages.hi[key];
      expect(hi.trim(), key).not.toBe("");
      expect([...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), key).toEqual([...hi.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());
    }
  });
  it("fills placeholders", () => {
    expect(translate("en", "credits.aria", { n: 3 })).toBe("3 credits left");
    expect(translate("hi", "credits.aria", { n: 3 })).toContain("3");
  });
  it("uses the required ALLOW wording and never says 'safe'", () => {
    expect(messages.en["verdict.allow.line"]).toBe("No strong risk signals found in the dataset");
    expect(messages.en["verdict.allow.line"].toLowerCase()).not.toContain("safe");
  });
});

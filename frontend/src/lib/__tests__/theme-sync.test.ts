import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** tokens.css is the design source of truth (also used by the static previews); theme.css feeds Tailwind. They must agree. */
const read = (f: string) => readFileSync(resolve(__dirname, "../../styles", f), "utf8");
const values = (css: string) => {
  const out = new Map<string, string>();
  for (const m of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out.set(m[1] as string, (m[2] as string).trim().toLowerCase());
  return out;
};
const tokens = values(read("tokens.css"));
const theme = values(read("theme.css"));

describe("theme.css matches tokens.css", () => {
  it("brand colours are identical", () => {
    for (const [name, value] of theme) {
      if (!name.startsWith("--color-") || /-(tint|ink)$/.test(name)) continue;
      if (["--color-allow", "--color-warn", "--color-block", "--color-unknown"].includes(name)) continue;
      expect(tokens.get(name), name).toBe(value);
    }
  });
  it("verdict colours map onto the --status-* tokens", () => {
    for (const verdict of ["allow", "warn", "block", "unknown"]) {
      expect(theme.get(`--color-${verdict}`), verdict).toBe(tokens.get(`--status-${verdict}-solid`));
      expect(theme.get(`--color-${verdict}-tint`), `${verdict}-tint`).toBe(tokens.get(`--status-${verdict}-tint`));
      expect(theme.get(`--color-${verdict}-ink`), `${verdict}-ink`).toBe(tokens.get(`--status-${verdict}-ink`));
    }
  });
  it("radii and type sizes are identical", () => {
    const pairs: [string, string][] = [
      ["--radius-nav", "--radius-nav"], ["--radius-tag", "--radius-tags"], ["--radius-card", "--radius-cards"],
      ["--radius-input", "--radius-inputs"], ["--radius-button", "--radius-buttons"], ["--radius-large", "--radius-largeelements"],
    ];
    for (const [t, k] of pairs) expect(theme.get(t), t).toBe(tokens.get(k));
    for (const s of ["caption", "small", "body", "body-lg", "subheading", "heading-sm", "heading", "heading-lg", "display", "display-xl"]) {
      expect(theme.get(`--text-${s}`), s).toBe(tokens.get(`--text-${s}`));
    }
  });
});

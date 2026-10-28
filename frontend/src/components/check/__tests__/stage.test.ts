import { describe, expect, it } from "vitest";
import { checkResponseSchema } from "@/lib/api/schemas";
import { replayFor, scriptIndexAt } from "../StageExperience";

describe("scriptIndexAt", () => {
  it("walks through the six segments of the 3-minute script", () => {
    expect(scriptIndexAt(0)).toBe(0);
    expect(scriptIndexAt(24)).toBe(0);
    expect(scriptIndexAt(25)).toBe(1);
    expect(scriptIndexAt(75)).toBe(2);
    expect(scriptIndexAt(135)).toBe(4);
    expect(scriptIndexAt(165)).toBe(5);
    expect(scriptIndexAt(999)).toBe(5);
  });
});

describe("replayFor", () => {
  it.each(["BLOCK", "WARN", "ALLOW", "UNKNOWN"] as const)("%s replay is a valid, clearly labelled replay that never claims TigerGraph", (v) => {
    const r = replayFor(v);
    expect(checkResponseSchema.safeParse(r).success).toBe(true);
    expect(r.verdict).toBe(v);
    expect(r.replay).toBe(true);
    expect(r.engine).toBe("replay");
  });
});

import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { FIXTURES } from "@/lib/mocks";
import { activeStepIndex, canFallBackToPlain, clearRecent, findRecent, flowReducer, initialFlow, RECENT_MS, type FlowState } from "@/lib/hooks/checkFlow";

const res = FIXTURES["DEMO-LICIT-02"]!;

describe("flowReducer", () => {
  it("goes idle -> checking -> done", () => {
    let s: FlowState = flowReducer(initialFlow, { type: "start", address: "DEMO-LICIT-02", now: 1 });
    expect(s).toMatchObject({ phase: "checking", address: "DEMO-LICIT-02", steps: [] });
    s = flowReducer(s, { type: "step", step: { id: "validate", label: "Validating address" } });
    s = flowReducer(s, { type: "step", step: { id: "graph", label: "Querying graph" } });
    expect(s.phase === "checking" && s.steps.map((x) => x.id)).toEqual(["validate", "graph"]);
    s = flowReducer(s, { type: "success", result: res, lang: "en", entryId: "e1" });
    expect(s).toMatchObject({ phase: "done", entryId: "e1", lang: "en" });
  });
  it("replaces a repeated step instead of duplicating it", () => {
    let s: FlowState = flowReducer(initialFlow, { type: "start", address: "a", now: 1 });
    s = flowReducer(s, { type: "step", step: { id: "graph", label: "one" } });
    s = flowReducer(s, { type: "step", step: { id: "graph", label: "two" } });
    expect(s.phase === "checking" && s.steps).toEqual([{ id: "graph", label: "two" }]);
  });
  it("ignores steps when not checking", () => {
    expect(flowReducer(initialFlow, { type: "step", step: { id: "graph", label: "x" } })).toBe(initialFlow);
  });
  it("keeps the address on failure and returns to idle on cancel/reset", () => {
    let s: FlowState = flowReducer(initialFlow, { type: "start", address: "abc", now: 1 });
    s = flowReducer(s, { type: "failure", code: "no_credits", message: "m", action: "open-credits" });
    expect(s).toMatchObject({ phase: "error", address: "abc", code: "no_credits", action: "open-credits" });
    expect(flowReducer(s, { type: "reset" })).toEqual(initialFlow);
    expect(flowReducer({ phase: "checking", address: "a", steps: [], startedAt: 1 }, { type: "cancel" })).toEqual(initialFlow);
  });
  it("can show a result directly (cached repeat / replay)", () => {
    const s = flowReducer(initialFlow, { type: "success", result: res, lang: "hi", replay: true });
    expect(s).toMatchObject({ phase: "done", replay: true });
  });
});

describe("activeStepIndex", () => {
  it("is the furthest step seen", () => {
    expect(activeStepIndex([])).toBe(-1);
    expect(activeStepIndex([{ id: "validate", label: "" }, { id: "hops", label: "" }])).toBe(2);
  });
});

describe("canFallBackToPlain", () => {
  it("only for a missing/broken stream before any step", () => {
    expect(canFallBackToPlain(new ApiError({ status: 404, code: "not_found" }), false)).toBe(true);
    expect(canFallBackToPlain(new ApiError({ status: 200, code: "stream_ended" }), false)).toBe(true);
    expect(canFallBackToPlain(new ApiError({ status: 200, code: "stream_ended" }), true)).toBe(false);
    expect(canFallBackToPlain(new ApiError({ status: 402, code: "no_credits" }), false)).toBe(false);
    expect(canFallBackToPlain(new Error("x"), false)).toBe(false);
  });
});

describe("findRecent", () => {
  it("is empty by default and ignores old entries", () => {
    clearRecent();
    expect(findRecent("DEMO-LICIT-02")).toBeUndefined();
    expect(RECENT_MS).toBe(600_000);
  });
});

import { describe, expect, it } from "vitest";
import type { BenchmarkModelRow, BenchmarkRow, CheckResponse } from "@/lib/api/types";
import type { HistoryEntry } from "@/lib/stores/history";
import { buildBenchmarkCsv, formatPercentChange, graphFeaturesHelped, percentChange, pickMethods } from "./pagesBenchmark";
import { exportHistoryJson, filterHistory } from "./pagesHistory";
import { formatCountdown, secondsLeft } from "./pagesTime";
import { CREDIT_AREAS, CREDIT_ROWS } from "./pagesCredits";

describe("percentChange", () => {
  it("computes the change and formats it with a sign", () => {
    expect(percentChange(4000, 400)).toBeCloseTo(-90);
    expect(formatPercentChange(percentChange(4000, 400))).toBe("-90%");
    expect(formatPercentChange(percentChange(80, 88))).toBe("+10%");
    expect(formatPercentChange(percentChange(5, 5))).toBe("0%");
  });
  it("is n/a without a base", () => {
    expect(percentChange(0, 10)).toBeNull();
    expect(formatPercentChange(null)).toBe("n/a");
  });
});

const rows: BenchmarkRow[] = [
  { method: "raw_dump", inputTokens: 4000, latencyMs: 3000, accuracyPct: 80 },
  { method: "graph_evidence", inputTokens: 400, latencyMs: 300, accuracyPct: 88 },
];
const model = (name: BenchmarkModelRow["name"], f1: number): BenchmarkModelRow => ({ name, illicitF1: f1, precision: 0.6, recall: 0.5 });

describe("benchmark helpers", () => {
  it("picks the two methods", () => {
    const p = pickMethods(rows);
    expect(p.raw?.inputTokens).toBe(4000);
    expect(p.graph?.latencyMs).toBe(300);
  });
  it("says whether graph features helped", () => {
    expect(graphFeaturesHelped([model("baseline", 0.5), model("with_graph_features", 0.55)])).toBe(true);
    expect(graphFeaturesHelped([model("baseline", 0.5), model("with_graph_features", 0.5)])).toBe(false);
    expect(graphFeaturesHelped([model("baseline", 0.5), model("with_graph_features", 0.4)])).toBe(false);
    expect(graphFeaturesHelped([model("baseline", 0.5)])).toBeNull();
  });
  it("builds a CSV with only returned values and escapes cells", () => {
    const csv = buildBenchmarkCsv({ sampleSize: 25, measuredAt: "2026-10-28T10:00:00Z", rows, models: [model("baseline", 0.5)] });
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("kind,name,sample_size,measured_at,input_tokens,latency_ms,accuracy_pct,illicit_f1,precision,recall");
    expect(lines[1]).toBe("method,raw_dump,25,2026-10-28T10:00:00Z,4000,3000,80,,,");
    expect(lines[3]).toBe("model,baseline,25,2026-10-28T10:00:00Z,,,,0.5,0.6,0.5");
    expect(buildBenchmarkCsv({ sampleSize: 1, rows: [], models: [] }).split("\n")).toHaveLength(2);
  });
});

const result = (address: string, verdict: CheckResponse["verdict"]): CheckResponse => ({
  status: "ok", address, chain: "bitcoin", verdict, riskScore: 10, datasetLabel: null, hopsToNearestIllicit: null,
  neighbors: { hop1: { illicit: 0, licit: 0, unknown: 0 }, hop2: { illicit: 0, licit: 0, unknown: 0 } },
  graphFeatures: {}, labelHits: { ofac: false, ransomwhere: false }, topReasons: [], subgraph: { nodes: [], links: [] },
  tigergraph: { queryName: "q", ms: 1 }, model: { name: "m" }, explanation: { en: "", hi: "" }, limitations: [],
});
const entry = (id: string, at: string, address: string, verdict: CheckResponse["verdict"]): HistoryEntry => ({ id, at, result: result(address, verdict) });
const history = [entry("a", "2026-10-28T10:00:00Z", "DEMO-LICIT-02", "ALLOW"), entry("b", "2026-10-28T12:00:00Z", "DEMO-ILLICIT-01", "BLOCK"), entry("c", "2026-10-28T11:00:00Z", "bc1qexample", "WARN")];

describe("filterHistory", () => {
  it("sorts newest first", () => {
    expect(filterHistory(history, { query: "", verdict: "all" }).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
  it("filters by verdict and by address text (case-insensitive)", () => {
    expect(filterHistory(history, { query: "", verdict: "BLOCK" }).map((e) => e.id)).toEqual(["b"]);
    expect(filterHistory(history, { query: "demo-", verdict: "all" }).map((e) => e.id)).toEqual(["b", "a"]);
    expect(filterHistory(history, { query: "demo-", verdict: "ALLOW" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterHistory(history, { query: "zzz", verdict: "all" })).toEqual([]);
  });
  it("exports JSON with the results and a null attestation by default", () => {
    const parsed = JSON.parse(exportHistoryJson(history.slice(0, 1))) as { id: string; attestationUid: string | null }[];
    expect(parsed[0]).toMatchObject({ id: "a", attestationUid: null });
  });
});

describe("countdown", () => {
  it("counts down and never goes negative", () => {
    const now = Date.parse("2026-10-28T10:00:00Z");
    expect(secondsLeft("2026-10-28T10:12:34Z", now)).toBe(754);
    expect(secondsLeft("2026-10-28T09:00:00Z", now)).toBe(0);
    expect(secondsLeft("not a date", now)).toBe(0);
  });
  it("formats mm:ss", () => {
    expect(formatCountdown(754)).toBe("12:34");
    expect(formatCountdown(5)).toBe("00:05");
    expect(formatCountdown(-3)).toBe("00:00");
  });
});

describe("credits data", () => {
  it("has a licence for every row and covers every area", () => {
    expect(CREDIT_ROWS.every((r) => r.licence.length > 0 && r.link.startsWith("https://"))).toBe(true);
    for (const a of CREDIT_AREAS) expect(CREDIT_ROWS.some((r) => r.area === a)).toBe(true);
  });
});

import { formatUsd, usageShare } from "./pagesMoney";

describe("money and usage", () => {
  it("formats prices", () => {
    expect(formatUsd(4)).toBe("$4.00");
    expect(formatUsd(0.5)).toBe("$0.50");
  });
  it("computes the usage share from negative activity only", () => {
    expect(usageShare([{ delta: -1 }, { delta: -1 }, { delta: 5 }], 3)).toEqual({ used: 2, total: 5, pct: 40 });
    expect(usageShare([], null)).toEqual({ used: 0, total: 0, pct: 0 });
  });
});

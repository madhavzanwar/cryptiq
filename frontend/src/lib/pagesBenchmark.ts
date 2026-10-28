import type { BenchmarkModelRow, BenchmarkRow } from "@/lib/api/types";

/** Percentage change from `from` to `to` ((to - from) / from * 100). null when `from` is 0 or not finite. */
export function percentChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return ((to - from) / from) * 100;
}

/** "-90%", "+10%", "0%" (whole numbers); "n/a" when there is no base to compare with. */
export function formatPercentChange(value: number | null): string {
  if (value === null) return "n/a";
  const rounded = Math.round(value);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded)}%`;
}

export interface MethodPair {
  raw: BenchmarkRow | undefined;
  graph: BenchmarkRow | undefined;
}

export function pickMethods(rows: BenchmarkRow[]): MethodPair {
  return { raw: rows.find((r) => r.method === "raw_dump"), graph: rows.find((r) => r.method === "graph_evidence") };
}

export interface ModelPair {
  baseline: BenchmarkModelRow | undefined;
  withGraph: BenchmarkModelRow | undefined;
}

export function pickModels(models: BenchmarkModelRow[]): ModelPair {
  return { baseline: models.find((m) => m.name === "baseline"), withGraph: models.find((m) => m.name === "with_graph_features") };
}

/**
 * true  = graph features raised the illicit-class F1,
 * false = they did not (equal or lower): the page then shows the neutral caption,
 * null  = one of the two models is missing, so nothing can be said.
 */
export function graphFeaturesHelped(models: BenchmarkModelRow[]): boolean | null {
  const { baseline, withGraph } = pickModels(models);
  if (!baseline || !withGraph) return null;
  return withGraph.illicitF1 > baseline.illicitF1;
}

const csvCell = (v: string | number | undefined): string => {
  if (v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One flat CSV with both tables. Only values the API returned are written. */
export function buildBenchmarkCsv(data: { measuredAt?: string; sampleSize: number; rows: BenchmarkRow[]; models: BenchmarkModelRow[] }): string {
  const head = ["kind", "name", "sample_size", "measured_at", "input_tokens", "latency_ms", "accuracy_pct", "illicit_f1", "precision", "recall"];
  const lines: string[] = [head.join(",")];
  for (const r of data.rows) {
    lines.push([ "method", r.method, data.sampleSize, data.measuredAt, r.inputTokens, r.latencyMs, r.accuracyPct, undefined, undefined, undefined ].map(csvCell).join(","));
  }
  for (const m of data.models) {
    lines.push([ "model", m.name, data.sampleSize, data.measuredAt, undefined, undefined, undefined, m.illicitF1, m.precision, m.recall ].map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}

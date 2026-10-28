import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkResponse } from "@/lib/api/types";
import { renderWithQuery } from "@/components/pages/__tests__/renderWithQuery";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/env", async (orig) => ({ ...(await orig<typeof import("@/lib/env")>()), USE_MOCKS: false }));
vi.mock("@/lib/api/instance", async () => {
  const { createApiClient } = await import("@/lib/api/client");
  return { api: createApiClient({ baseUrl: "", fetchImpl: (...a: Parameters<typeof fetch>) => fetchMock(...a) as Promise<Response> }) };
});
const reply = (body: unknown) => fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));

async function mount() {
  const { BenchmarkView } = await import("../BenchmarkView");
  return renderWithQuery(<BenchmarkView />);
}
beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.restoreAllMocks());

/** Odd numbers nobody would hard-code: if they show up, they came from the API response. */
const MEASURED: BenchmarkResponse = {
  status: "ok",
  measuredAt: "2026-10-28T10:00:00Z",
  sampleSize: 13,
  rows: [
    { method: "raw_dump", inputTokens: 7777, latencyMs: 9191, accuracyPct: 61 },
    { method: "graph_evidence", inputTokens: 1234, latencyMs: 4242, accuracyPct: 73 },
  ],
  models: [
    { name: "baseline", illicitF1: 0.3141, precision: 0.2718, recall: 0.1618 },
    { name: "with_graph_features", illicitF1: 0.4142, precision: 0.5772, recall: 0.3141 },
  ],
};

describe("benchmark renders only API data", () => {
  it("not_measured: no metric numbers at all", async () => {
    reply({ status: "not_measured" });
    const { container } = await mount();
    await screen.findByText("Not measured yet");
    expect(container.textContent ?? "").not.toMatch(/\d/);
  });

  it("measured: every metric shown comes from the response and old defaults never appear", async () => {
    reply(MEASURED);
    const { container } = await mount();
    await screen.findByText(/on 13 held-out wallets/);
    const text = container.textContent ?? "";
    for (const v of ["7,777", "9,191", "1,234", "4,242", "61", "73"]) expect(text, v).toContain(v);
    expect(text).toMatch(/0\.3141|0\.314/);
    // none of the values the mock backend or earlier drafts used
    for (const v of ["4,000", "3,000", "400", "300", "80%", "88%"]) expect(text, v).not.toContain(v);
    // every number in the tables is either from the data or a percentage computed from it
    const allowed = new Set(["7777", "9191", "1234", "4242", "61", "73", "13", "0.3141", "0.4142", "0.2718", "0.5772", "0.1618", "0.3141"]);
    const cells = [...container.querySelectorAll("table td")].map((td) => td.textContent ?? "");
    for (const cell of cells) {
      for (const m of cell.replace(/,/g, "").matchAll(/-?\d+(?:\.\d+)?/g)) {
        const isPercentChange = /%/.test(cell);
        const n = m[0];
        const ok = allowed.has(n) || allowed.has(Number(n).toFixed(4)) || allowed.has(Number(n).toFixed(3)) || isPercentChange || /\d{4}-\d{2}-\d{2}/.test(cell) || [...allowed].some((a) => Number(a).toFixed(3) === Number(n).toFixed(3));
        expect(ok, `${n} in "${cell}"`).toBe(true);
      }
    }
  });
});

describe("benchmark components contain no hard-coded metric numbers (static scan)", () => {
  // Numbers that are layout/logic constants, not metrics: 0/1/2 (indexes, minimums), 100 (percent maths),
  // 1000 (ms per second, poll interval), 3 (decimals when formatting F1/precision/recall). Anything else fails
  // this test and must be justified here.
  const ALLOWED = new Set(["0", "1", "2", "3", "100", "1000"]);
  const dir = resolve(__dirname, "..");
  const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));

  const stripNonCode = (src: string) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/`(?:[^`\\]|\\.)*`/g, "``")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");

  it.each(files)("%s", (f) => {
    const code = stripNonCode(readFileSync(resolve(dir, f), "utf8"));
    const numbers = [...code.matchAll(/(?<![\w.$])\d+(?:\.\d+)?(?![\w])/g)].map((m) => m[0]);
    const bad = numbers.filter((n) => !ALLOWED.has(n));
    expect(bad, `numeric literals in ${f}`).toEqual([]);
  });
});

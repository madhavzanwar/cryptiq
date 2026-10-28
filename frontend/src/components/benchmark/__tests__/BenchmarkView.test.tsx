import type { BenchmarkResponse } from "@/lib/api/types";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/components/pages/__tests__/renderWithQuery";

const flags = vi.hoisted(() => ({ mocks: false }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", async (orig) => ({ ...(await orig<typeof import("@/lib/env")>()), get USE_MOCKS() { return flags.mocks; } }));
// the REAL api client on top of a fake fetch, so errors come from the same code path as in the app
vi.mock("@/lib/api/instance", async () => {
  const { createApiClient } = await import("@/lib/api/client");
  return { api: createApiClient({ baseUrl: "", fetchImpl: (...args: Parameters<typeof fetch>) => fetchMock(...args) as Promise<Response> }) };
});
const reply = (body: unknown, status = 200) => fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

const rows = [
  { method: "raw_dump" as const, inputTokens: 4000, latencyMs: 3000, accuracyPct: 80 },
  { method: "graph_evidence" as const, inputTokens: 400, latencyMs: 300, accuracyPct: 88 },
];
const ok = (baselineF1: number, graphF1: number): BenchmarkResponse => ({
  status: "ok", measuredAt: "2026-10-28T10:00:00Z", sampleSize: 25, rows,
  models: [
    { name: "baseline", illicitF1: baselineF1, precision: 0.6, recall: 0.5 },
    { name: "with_graph_features", illicitF1: graphF1, precision: 0.6, recall: 0.5 },
  ],
});

async function mount(mocks = false) {
  flags.mocks = mocks;
  vi.resetModules();
  const { BenchmarkView } = await import("../BenchmarkView");
  return renderWithQuery(<BenchmarkView />);
}

beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("BenchmarkView", () => {
  it("shows the empty state and invents no numbers when nothing is measured", async () => {
    reply({ status: "not_measured" });
    await mount();
    expect(await screen.findByText("Not measured yet")).toBeInTheDocument();
    expect(screen.getByText("Numbers come from the backend. We never invent results.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    // the public site only shows results: no run control, no sample banner
    expect(screen.queryByRole("button", { name: "Run benchmark" })).toBeNull();
    expect(screen.queryByText("SAMPLE ONLY (mock)")).toBeNull();
  });

  it("in mock mode labels the page as sample data and offers the run control", async () => {
    reply({ status: "not_measured" });
    await mount(true);
    expect(await screen.findByText("SAMPLE ONLY (mock)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run benchmark" })).toBeInTheDocument();
  });

  it("shows measured numbers, the percentage change and the neutral caption when graph features did not help", async () => {
    reply(ok(0.5, 0.5));
    await mount();
    expect(await screen.findByText(/on 25 held-out wallets/)).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getAllByText("-90%")).toHaveLength(2); // tokens 4000 -> 400 and latency 3000 -> 300
    expect(screen.getByText("Graph features did not improve F1 in this run; the graph still provides evidence and fast lookup.")).toBeInTheDocument();
  });

  it("hides the caption when graph features raised F1", async () => {
    reply(ok(0.5, 0.6));
    await mount();
    await screen.findByText(/on 25 held-out wallets/);
    expect(screen.queryByText(/did not improve F1/)).toBeNull();
  });

  it("shows an error with a retry button when the request fails", async () => {
    reply({ error: "internal_error" }, 500);
    await mount();
    expect(await screen.findByText("Could not load the benchmark.")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

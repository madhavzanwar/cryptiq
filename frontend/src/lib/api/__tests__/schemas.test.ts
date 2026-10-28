import { describe, expect, it } from "vitest";
import {
  benchmarkJobSchema,
  benchmarkResponseSchema,
  checkResponseSchema,
  creditsResponseSchema,
  cryptoInvoiceSchema,
  demoWalletsResponseSchema,
  healthResponseSchema,
  invoiceStatusSchema,
  transcribeResponseSchema,
} from "../schemas";

/** Shape of what `to_wire` emits for a scored wallet on TigerGraph (unset optionals are omitted). */
const okWire = () => ({
  status: "ok",
  address: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
  chain: "bitcoin",
  verdict: "BLOCK",
  riskScore: 97,
  datasetLabel: "illicit",
  hopsToNearestIllicit: 1,
  neighbors: {
    hop1: { illicit: 2, licit: 1, unknown: 4 },
    hop2: { illicit: 5, licit: 9, unknown: 30 },
    hop3: { illicit: 11, licit: 40, unknown: 120 },
  },
  graphFeatures: { pagerank: 0.00000123456789, componentSize: 1234 },
  labelHits: { ofac: false, ransomwhere: true },
  topReasons: ["Directly connected to a flagged wallet", "Listed in Ransomwhere"],
  subgraph: {
    nodes: [
      { id: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT", label: "illicit", hop: 0, isSubject: true },
      { id: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", label: "unknown", hop: 1, riskScore: 41.5 },
    ],
    links: [{ source: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT", target: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy" }],
  },
  tigergraph: { queryName: "khop_exposure", ms: 12.34, gsql: "CREATE QUERY khop_exposure() { }" },
  model: { name: "xgboost-with_graph_features", illicitF1Test: 0.81 },
  explanation: { en: "High risk.", hi: "जोखिम ज़्यादा है।" },
  audioUrl: "/api/audio/abc123.mp3",
  limitations: ["Risk signal, not an accusation."],
  reportHash: "0x50b4640de921e417dd1a2cd38595fc7275b2b746a6a133258efa6488e630f3f7",
  creditsRemaining: 2,
  cached: false,
  engine: "tigergraph",
  replay: false,
  truncated: false,
});

/** Looks like a recorded real response for a wallet that is not in the dataset. */
const notInDatasetWire = () => ({
  status: "not_in_dataset",
  address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  chain: "bitcoin",
  verdict: "UNKNOWN",
  riskScore: null,
  datasetLabel: null,
  hopsToNearestIllicit: null,
  neighbors: { hop1: { illicit: 0, licit: 0, unknown: 0 }, hop2: { illicit: 0, licit: 0, unknown: 0 } },
  graphFeatures: {},
  labelHits: { ofac: false, ransomwhere: false },
  topReasons: ["Not in the Elliptic++ research dataset, so there is no graph evidence"],
  subgraph: { nodes: [], links: [] },
  tigergraph: { queryName: "tigergraph.lookup", ms: 3.1 },
  model: { name: "xgboost-with_graph_features", illicitF1Test: null },
  explanation: { en: "There is insufficient evidence to score this wallet.", hi: "इस वॉलेट को जाँचने के लिए पर्याप्त सबूत नहीं हैं।" },
  limitations: ["Not in the research dataset: absence from the data is not evidence of safety."],
  reportHash: "0x69bb95f3e168b9fc96865d136a833e99f31553af480c91d5b48b65a4badc0ead",
  creditsRemaining: 3,
  cached: false,
  engine: "replay",
  replay: true,
  truncated: false,
});

describe("checkResponseSchema", () => {
  it("parses a full response", () => {
    const r = checkResponseSchema.parse(okWire());
    expect(r.riskScore).toBe(97);
    expect(r.engine).toBe("tigergraph");
    expect(r.neighbors.hop3?.illicit).toBe(11);
    expect(r.subgraph.nodes[0]?.isSubject).toBe(true);
    expect(r.tigergraph.gsql).toContain("khop_exposure");
  });

  it("parses a not_in_dataset response where riskScore is null", () => {
    const r = checkResponseSchema.parse(notInDatasetWire());
    expect(r.status).toBe("not_in_dataset");
    expect(r.riskScore).toBeNull();
    expect(r.datasetLabel).toBeNull();
    expect(r.hopsToNearestIllicit).toBeNull();
    expect(r.verdict).toBe("UNKNOWN");
    expect(r.replay).toBe(true);
    expect(r.neighbors.hop3).toBeUndefined();
    expect(r.model.illicitF1Test).toBeNull();
  });

  it("requires the nullable fields to be present (null is not the same as missing)", () => {
    for (const key of ["riskScore", "datasetLabel", "hopsToNearestIllicit"]) {
      const { [key]: _removed, ...rest } = notInDatasetWire() as Record<string, unknown>;
      expect(checkResponseSchema.safeParse(rest).success, key).toBe(false);
    }
  });

  it("accepts a response without any of the optional additions", () => {
    const {
      cached: _c, engine: _e, replay: _r, truncated: _t, creditsRemaining: _cr, reportHash: _h, audioUrl: _a,
      ...minimal
    } = okWire();
    const r = checkResponseSchema.parse(minimal);
    expect(r.cached).toBeUndefined();
    expect(r.engine).toBeUndefined();
    expect(r.isMock).toBeUndefined();
  });

  it("tolerates unknown extra fields and nulls on optional fields", () => {
    const r = checkResponseSchema.parse({
      ...okWire(),
      futureField: { a: 1 },
      cached: null,
      audioUrl: null,
      subgraph: { nodes: [{ id: "a", label: "licit", hop: 0, newThing: 1 }], links: [], extra: true },
    });
    expect(r.cached).toBeUndefined();
    expect(r.audioUrl).toBeNull();
    expect(r.subgraph.nodes).toHaveLength(1);
  });

  it("parses the 503 error body (status error)", () => {
    const r = checkResponseSchema.parse({
      ...notInDatasetWire(),
      status: "error",
      error: "graph_unavailable",
      tigergraph: { queryName: "none", ms: 0 },
      isMock: true,
    });
    expect(r.status).toBe("error");
    expect(r.error).toBe("graph_unavailable");
    expect(r.isMock).toBe(true);
  });

  it("rejects bad enums and wrong types", () => {
    expect(checkResponseSchema.safeParse({ ...okWire(), verdict: "MAYBE" }).success).toBe(false);
    expect(checkResponseSchema.safeParse({ ...okWire(), riskScore: "97" }).success).toBe(false);
    expect(checkResponseSchema.safeParse({ ...okWire(), chain: "ethereum" }).success).toBe(false);
    expect(checkResponseSchema.safeParse({ error: "no_credits" }).success).toBe(false);
  });
});

describe("other response schemas", () => {
  it("transcribe", () => {
    expect(transcribeResponseSchema.parse({ text: "check 1A1z", address: null, provider: "browser" }).address).toBeNull();
    expect(transcribeResponseSchema.safeParse({ text: "x", provider: "wispr" }).success).toBe(false);
  });

  it("credits", () => {
    const r = creditsResponseSchema.parse({
      balance: 3,
      packs: [{ id: "starter", credits: 10, priceUsd: 4.99, label: "Starter" }],
    });
    expect(r.packs[0]?.priceUsd).toBe(4.99);
  });

  it("crypto invoice and status", () => {
    const inv = cryptoInvoiceSchema.parse({
      invoiceId: "inv_1",
      uri: "bitcoin:bc1q...?amount=0.0001",
      address: "bc1q...",
      amount: "0.0001",
      coin: "btc",
      expiresAt: "2026-10-28T12:00:00+00:00",
      provider: "explorer",
    });
    expect(inv.provider).toBe("explorer");
    expect(invoiceStatusSchema.parse({ status: "paid" }).status).toBe("paid");
    expect(invoiceStatusSchema.safeParse({ status: "refunded" }).success).toBe(false);
  });

  it("demo wallets", () => {
    const r = demoWalletsResponseSchema.parse({ wallets: [{ address: "a", note: "n", expected: "WARN" }] });
    expect(r.wallets[0]?.expected).toBe("WARN");
    expect(demoWalletsResponseSchema.parse({ wallets: [] }).wallets).toEqual([]);
  });

  it("benchmark: not_measured and ok", () => {
    expect(benchmarkResponseSchema.parse({ status: "not_measured" })).toEqual({ status: "not_measured" });
    const ok = benchmarkResponseSchema.parse({
      status: "ok",
      measuredAt: "2026-10-28T10:00:00+00:00",
      sampleSize: 25,
      rows: [{ method: "raw_dump", inputTokens: 5000, latencyMs: 2100.5, accuracyPct: 52 }],
      models: [{ name: "baseline", illicitF1: 0.7, precision: 0.8, recall: 0.62 }],
    });
    expect(ok.status === "ok" && ok.rows[0]?.method).toBe("raw_dump");
    expect(benchmarkResponseSchema.safeParse({ status: "ok" }).success).toBe(false);
  });

  it("benchmark job", () => {
    expect(benchmarkJobSchema.parse({ status: "running", progress: 0.4 }).error).toBeUndefined();
    expect(benchmarkJobSchema.parse({ status: "failed", progress: 0.2, error: "TimeoutError" }).error).toBe("TimeoutError");
  });

  it("health with and without diagnostics", () => {
    expect(healthResponseSchema.parse({ ok: true, voiceProvider: "browser" }).mocks).toBeUndefined();
    const h = healthResponseSchema.parse({
      ok: true,
      voiceProvider: "sarvam",
      mocks: true,
      engine: "networkx",
      engineOk: true,
      modelLoaded: true,
      llmConfigured: false,
      dataSource: "synthetic_fixture",
    });
    expect(h.dataSource).toBe("synthetic_fixture");
  });
});

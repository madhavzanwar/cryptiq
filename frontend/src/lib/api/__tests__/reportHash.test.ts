import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { describe, expect, it } from "vitest";
import { canonicalJson, computeReportHash, evidenceFor, verifyReportHash } from "../reportHash";
import type { CheckResponse } from "../types";

// ethers.keccak256(ethers.toUtf8Bytes(s)) returns "0x..."; noble returns bytes, so build the same shape.
const keccak = (s: string): string => "0x" + bytesToHex(keccak_256(utf8ToBytes(s)));

const zero = { illicit: 0, licit: 0, unknown: 0 };

function response(over: Partial<CheckResponse>): CheckResponse {
  return {
    status: "ok",
    address: "x",
    chain: "bitcoin",
    verdict: "UNKNOWN",
    riskScore: null,
    datasetLabel: null,
    hopsToNearestIllicit: null,
    neighbors: { hop1: zero, hop2: zero },
    graphFeatures: {},
    labelHits: { ofac: false, ransomwhere: false },
    topReasons: [],
    subgraph: { nodes: [], links: [] },
    tigergraph: { queryName: "networkx.khop_exposure", ms: 1.5 },
    model: { name: "xgboost-with_graph_features" },
    explanation: { en: "", hi: "" },
    limitations: [],
    ...over,
  };
}

// Golden values below were produced by the backend itself (backend/app/services/report_hash.py,
// evidence built exactly like pipeline._assemble) with pycryptodome's keccak.
const BLOCK = response({
  address: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
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
  reportHash: "0x50b4640de921e417dd1a2cd38595fc7275b2b746a6a133258efa6488e630f3f7",
});

const ALLOW_MOCK = response({
  address: "DEMO-allow01",
  isMock: true,
  verdict: "ALLOW",
  riskScore: 4,
  datasetLabel: "licit",
  neighbors: { hop1: { illicit: 0, licit: 3, unknown: 1 }, hop2: { illicit: 0, licit: 8, unknown: 2 } },
  graphFeatures: { pagerank: 3.2e-7, componentSize: 58 },
  reportHash: "0x3a3ed14fe079b8599808f1e3a71c261459899afa60ca497587439a3d27f1f3f2",
});

const NOT_IN_DATASET = response({
  address: "DEMO-sanctioned1",
  isMock: true,
  status: "not_in_dataset",
  verdict: "BLOCK",
  labelHits: { ofac: true, ransomwhere: false },
  model: { name: "xgboost-baseline" },
  reportHash: "0x69bb95f3e168b9fc96865d136a833e99f31553af480c91d5b48b65a4badc0ead",
});

describe("canonicalJson", () => {
  it("matches the contract test vectors", () => {
    expect(canonicalJson({})).toBe("{}");
    expect(keccak(canonicalJson({}))).toBe("0xb48d38f93eaa084033fc5970bf96e559c33c4cdc07d889ab00b4d63f9590739d");
    const v = canonicalJson({ b: [true, null, "x"], a: 1 });
    expect(v).toBe('{"a":1,"b":[true,null,"x"]}');
    expect(keccak(v)).toBe("0x339e8a1d3314cd7f250bf6a7a3cdf2eda788cf4e5314d1ba2b131b4b4d93daad");
  });

  it("sorts keys recursively and keeps array order", () => {
    expect(canonicalJson({ z: { b: 1, a: [{ y: 1, x: 2 }] }, a: 0 })).toBe('{"a":0,"z":{"a":[{"x":2,"y":1}],"b":1}}');
  });

  it("keeps non-ASCII as-is (same bytes and hash as the backend)", () => {
    const v = canonicalJson({ hi: "जोखिम", a: "é" });
    expect(v).toBe('{"a":"é","hi":"जोखिम"}');
    expect(keccak(v)).toBe("0xec3f0664dc1041c6ad30ed978d0951b8250c85f2e1cdbb3ff6a3d5c00170643d");
  });

  it("sorts keys by code point, like Python (U+FFFF before U+1F600)", () => {
    expect(canonicalJson({ "\u{1F600}": 2, "￿": 1, a: 3 })).toBe('{"a":3,"￿":1,"\u{1F600}":2}');
  });

  it("escapes quotes, backslashes and control characters", () => {
    expect(canonicalJson({ s: 'a"b\\c\n\u0001' })).toBe('{"s":"a\\"b\\\\c\\n\\u0001"}');
  });

  it("throws on floats and unsupported values", () => {
    expect(() => canonicalJson({ a: 0.5 })).toThrow(TypeError);
    expect(() => canonicalJson([1, [2, Number.NaN]])).toThrow(TypeError);
    expect(() => canonicalJson({ a: Infinity })).toThrow(TypeError);
    expect(() => canonicalJson({ a: undefined })).toThrow(TypeError);
    expect(() => canonicalJson({ a: 10n })).toThrow(TypeError);
    expect(() => canonicalJson(new Date(0))).toThrow(TypeError);
  });
});

describe("evidenceFor", () => {
  it("builds the evidence object from the contract", () => {
    expect(evidenceFor(BLOCK)).toEqual({
      address: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
      chain: "bitcoin",
      dataset: "elliptic++",
      datasetLabel: "illicit",
      hopsToNearestIllicit: 1,
      labelHits: { ofac: false, ransomwhere: true },
      model: "xgboost-with_graph_features",
      neighbors: {
        hop1: { illicit: 2, licit: 1, unknown: 4 },
        hop2: { illicit: 5, licit: 9, unknown: 30 },
        hop3: { illicit: 11, licit: 40, unknown: 120 },
      },
      pagerank: "0.00000123",
      componentSize: 1234,
      riskScore: 97,
      verdict: "BLOCK",
    });
  });

  it("uses null for missing hop3, pagerank, componentSize, riskScore", () => {
    const e = evidenceFor(NOT_IN_DATASET);
    expect(e.neighbors.hop3).toBeNull();
    expect(e.pagerank).toBeNull();
    expect(e.componentSize).toBeNull();
    expect(e.riskScore).toBeNull();
    expect(e.dataset).toBe("synthetic_fixture");
  });

  it("formats pagerank with 8 decimals", () => {
    expect(evidenceFor(response({ graphFeatures: { pagerank: 3.2e-7 } })).pagerank).toBe("0.00000032");
    expect(evidenceFor(response({ graphFeatures: { pagerank: 0 } })).pagerank).toBe("0.00000000");
    expect(evidenceFor(response({ graphFeatures: { pagerank: 0.5 } })).pagerank).toBe("0.50000000");
  });

  it("ignores extra fields inside counts", () => {
    const r = response({ neighbors: { hop1: { illicit: 1, licit: 2, unknown: 3, extra: 9 } as never, hop2: zero } });
    expect(evidenceFor(r).neighbors.hop1).toEqual({ illicit: 1, licit: 2, unknown: 3 });
  });
});

describe("verifyReportHash", () => {
  it.each([
    ["BLOCK with hop3", BLOCK],
    ["ALLOW on the synthetic fixture", ALLOW_MOCK],
    ["not_in_dataset with nulls", NOT_IN_DATASET],
  ])("reproduces the backend hash: %s", (_name, r) => {
    expect(computeReportHash(r, keccak)).toBe(r.reportHash);
    expect(verifyReportHash(r, keccak)).toBe(true);
  });

  it("accepts a keccak that returns hex without 0x, and an uppercase reportHash", () => {
    const bare = (s: string) => bytesToHex(keccak_256(utf8ToBytes(s)));
    expect(verifyReportHash(BLOCK, bare)).toBe(true);
    expect(verifyReportHash({ ...BLOCK, reportHash: BLOCK.reportHash?.toUpperCase().replace("0X", "0x") }, bare)).toBe(true);
  });

  it("detects tampering", () => {
    expect(verifyReportHash({ ...BLOCK, verdict: "ALLOW" }, keccak)).toBe(false);
    expect(verifyReportHash({ ...BLOCK, riskScore: 96 }, keccak)).toBe(false);
    expect(verifyReportHash({ ...BLOCK, address: "1Other" }, keccak)).toBe(false);
  });

  it("is false when there is no reportHash (error responses)", () => {
    expect(verifyReportHash(response({ status: "error", error: "graph_unavailable" }), keccak)).toBe(false);
  });

  it("lets the caller override the dataset", () => {
    expect(verifyReportHash(ALLOW_MOCK, keccak, { dataset: "elliptic++" })).toBe(false);
    expect(verifyReportHash(ALLOW_MOCK, keccak, { dataset: "synthetic_fixture" })).toBe(true);
  });
});

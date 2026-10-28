import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { keccak256 as viemKeccak, toBytes } from "viem";
import { keccak256, toUtf8Bytes } from "ethers";
import { describe, expect, it } from "vitest";
import { canonicalJson, computeReportHash, evidenceFor, verifyReportHash } from "@/lib/api/reportHash";
import type { CheckResponse } from "@/lib/api/types";
import { keccakUtf8 } from "../keccak";
import allow from "./fixtures/real-check-allow.json";
import block from "./fixtures/real-check-block.json";

const ethersKeccak = (s: string) => keccak256(toUtf8Bytes(s));

/** The 'Test vectors' table of docs/api-contract.md, read at test time so the test can never drift from the doc. */
function contractVectors(): { json: string; hash: string }[] {
  const md = readFileSync(resolve(__dirname, "../../../../../docs/api-contract.md"), "utf8");
  const section = md.slice(md.indexOf("Test vectors"));
  const rows = [...section.matchAll(/^\|\s*`(.+)`\s*\|\s*`(0x[0-9a-f]{64})`\s*\|\s*$/gm)];
  return rows.map((m) => ({ json: m[1] as string, hash: m[2] as string }));
}

describe("report hash vectors from docs/api-contract.md", () => {
  const vectors = contractVectors();

  it("finds the vectors in the contract (at least the two published ones)", () => {
    expect(vectors.length).toBeGreaterThanOrEqual(2);
  });

  it.each(vectors.map((v) => [v.json, v.hash] as const))("keccak256(%s) = %s (ethers and viem)", (json, hash) => {
    expect(ethersKeccak(json)).toBe(hash);
    expect(keccakUtf8(json)).toBe(hash); // the light helper used by the page, via viem
    expect(viemKeccak(toBytes(json))).toBe(hash);
  });

  it.each(vectors.map((v) => [v.json] as const))("canonicalJson reproduces the contract's canonical form for %s", (json) => {
    expect(canonicalJson(JSON.parse(json))).toBe(json);
  });

  it("canonicalJson sorts keys recursively, has no whitespace and rejects floats", () => {
    expect(canonicalJson({ b: { z: 1, a: [true, null] }, a: "é" })).toBe('{"a":"é","b":{"a":[true,null],"z":1}}');
    expect(() => canonicalJson({ x: 0.5 })).toThrow(/float/);
  });

  it("the evidence object pre-formats floats as strings and nulls hop3 when it was not computed", () => {
    const res = { ...(block as unknown as CheckResponse), graphFeatures: { pagerank: 0.00023848423099964524, componentSize: 2400 } };
    const withoutHop3 = { ...res, neighbors: { hop1: res.neighbors.hop1, hop2: res.neighbors.hop2 } } as CheckResponse;
    const ev = evidenceFor(withoutHop3);
    expect(ev.pagerank).toBe("0.00023848");
    expect(ev.neighbors.hop3).toBeNull();
    expect(canonicalJson(ev)).toContain('"pagerank":"0.00023848"');
    expect(canonicalJson(ev)).not.toMatch(/\s/);
  });
});

describe("REAL backend responses (synthetic fixture, saved from GET /api/check)", () => {
  const cases = [
    ["BLOCK", block],
    ["ALLOW", allow],
  ] as const;

  it.each(cases)("%s: the browser recomputes exactly the hash the backend sent", (_name, fixture) => {
    const res = fixture as unknown as CheckResponse;
    expect(res.reportHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(computeReportHash(res, ethersKeccak)).toBe(res.reportHash);
    expect(computeReportHash(res, keccakUtf8)).toBe(res.reportHash);
    expect(verifyReportHash(res, ethersKeccak)).toBe(true);
    expect(verifyReportHash(res, keccakUtf8)).toBe(true);
  });

  it("the fixtures are the synthetic dataset (isMock) so the evidence says 'synthetic_fixture'", () => {
    expect((block as unknown as CheckResponse).isMock).toBe(true);
    expect(evidenceFor(block as unknown as CheckResponse).dataset).toBe("synthetic_fixture");
  });

  it("changing any hashed evidence field breaks the match", () => {
    const res = block as unknown as CheckResponse;
    expect(verifyReportHash({ ...res, riskScore: 5 }, keccakUtf8)).toBe(false);
    expect(verifyReportHash({ ...res, verdict: "ALLOW" }, keccakUtf8)).toBe(false);
    expect(verifyReportHash({ ...res, address: "DEMO-w00000" }, keccakUtf8)).toBe(false);
    expect(verifyReportHash({ ...res, labelHits: { ofac: !res.labelHits.ofac, ransomwhere: false } }, keccakUtf8)).toBe(false);
  });
});

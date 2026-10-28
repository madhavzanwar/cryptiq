import { describe, expect, it, vi } from "vitest";
import type { CheckResponse } from "@/lib/api/types";
import { fieldsFor } from "../rules";
import { keccakUtf8 } from "../keccak";
import { checkLocalHash, classifyVerifyError, compareOnChain, VerifyError } from "../verify";
import { HashMismatchError, classifyAttestError } from "../rules";
import { reportSubmitted } from "../attest";
import block from "./fixtures/real-check-block.json";

const RES = block as unknown as CheckResponse;
const goodFields = () => fieldsFor(RES, RES.reportHash as string);

describe("checkLocalHash", () => {
  it("match: backend hash equals the browser's recomputation", () => {
    const c = checkLocalHash(RES, keccakUtf8);
    expect(c.outcome).toBe("match");
    expect(c.local).toBe(RES.reportHash);
  });
  it("mismatch: the backend hash differs from what the evidence hashes to", () => {
    const bad = "0x" + "12".repeat(32);
    const c = checkLocalHash({ ...RES, reportHash: bad }, keccakUtf8);
    expect(c).toMatchObject({ outcome: "mismatch", backend: bad, local: RES.reportHash });
  });
  it("mismatch when the result was tampered with but the old hash kept", () => {
    expect(checkLocalHash({ ...RES, riskScore: 3 }, keccakUtf8).outcome).toBe("mismatch");
  });
  it("no_backend_hash is NOT a match (nothing to compare)", () => {
    expect(checkLocalHash({ ...RES, reportHash: undefined }, keccakUtf8).outcome).toBe("no_backend_hash");
    expect(checkLocalHash({ ...RES, reportHash: "nope" }, keccakUtf8).outcome).toBe("no_backend_hash");
  });
});

describe("compareOnChain", () => {
  it("match when every stored field agrees with this result", () => {
    const c = compareOnChain(RES, goodFields(), keccakUtf8);
    expect(c.outcome).toBe("match");
    expect(c.mismatched).toEqual([]);
  });
  it("accepts an upper-case stored hash (bytes32 hex has no canonical case)", () => {
    const f = goodFields();
    expect(compareOnChain(RES, { ...f, reportHash: f.reportHash.toUpperCase().replace("0X", "0x") }, keccakUtf8).outcome).toBe("match");
  });
  it.each([
    ["verdict", { verdict: "ALLOW" }],
    ["riskScore", { riskScore: 12 }],
    ["subjectAddress", { subjectAddress: "DEMO-w00000" }],
    ["chain", { chain: "ethereum" }],
    ["reportHash", { reportHash: "0x" + "ab".repeat(32) }],
  ])("mismatch names the differing field: %s", (field, patch) => {
    const c = compareOnChain(RES, { ...goodFields(), ...patch }, keccakUtf8);
    expect(c.outcome).toBe("mismatch");
    expect(c.mismatched).toEqual([field]);
  });
  it("tampered result: the stored attestation no longer matches what the page now shows", () => {
    const tampered = { ...RES, riskScore: 20, verdict: "ALLOW" as const };
    const c = compareOnChain(tampered, goodFields(), keccakUtf8);
    expect(c.outcome).toBe("mismatch");
    expect(c.mismatched).toEqual(expect.arrayContaining(["riskScore", "verdict", "reportHash"]));
  });
  it("mismatch when the backend hash and the recomputed hash disagree, even if the chain equals the backend's", () => {
    const wrongBackend = "0x" + "34".repeat(32);
    const c = compareOnChain({ ...RES, reportHash: wrongBackend }, { ...goodFields(), reportHash: wrongBackend }, keccakUtf8);
    expect(c.fields.reportHash).toBe(false);
    expect(c.outcome).toBe("mismatch");
  });
  it("revoked attestations never show Match", () => {
    expect(compareOnChain(RES, goodFields(), keccakUtf8, { revoked: true }).outcome).toBe("revoked");
  });
});

describe("classifyVerifyError", () => {
  it("maps network-ish, typed and unknown failures", () => {
    expect(classifyVerifyError(new TypeError("Failed to fetch"))).toBe("network");
    expect(classifyVerifyError(new Error("request timeout"))).toBe("network");
    expect(classifyVerifyError(new VerifyError("not_found"))).toBe("not_found");
    expect(classifyVerifyError(new VerifyError("network", "timeout"))).toBe("network");
    expect(classifyVerifyError(new Error("something odd"))).toBe("other");
  });
});

describe("pre-attestation guard and pending-tx reporting", () => {
  it("HashMismatchError is classified as its own friendly case", () => {
    expect(classifyAttestError(new HashMismatchError("0xa", "0xb"))).toMatchObject({ kind: "hash_mismatch", messageKey: "web3.error.hashMismatch" });
  });

  it("submitAttestation refuses BEFORE touching the signer when the hash does not match", async () => {
    const { submitAttestation } = await import("../attest");
    const signer = { estimateGas: vi.fn(), call: vi.fn(), resolveName: vi.fn(), sendTransaction: vi.fn() };
    await expect(
      submitAttestation({
        signer,
        contract: "0x4200000000000000000000000000000000000021",
        schemaUid: "0x" + "00".repeat(32),
        recipient: "0x" + "11".repeat(20),
        result: { ...RES, reportHash: "0x" + "99".repeat(32) },
      }),
    ).rejects.toBeInstanceOf(HashMismatchError);
    expect(signer.estimateGas).not.toHaveBeenCalled();
    expect(signer.sendTransaction).not.toHaveBeenCalled();
  });

  it("reportSubmitted forwards sendTransaction and reports the hash the moment it is sent", async () => {
    const sent = { hash: "0x" + "ab".repeat(32) };
    const base = { estimateGas: vi.fn(async () => 1n), call: vi.fn(), resolveName: vi.fn(), sendTransaction: vi.fn(async () => sent) };
    const seen: string[] = [];
    const wrapped = reportSubmitted(base, (h) => seen.push(h));
    expect(await wrapped.sendTransaction({})).toBe(sent);
    expect(seen).toEqual([sent.hash]);
    expect(await wrapped.estimateGas({})).toBe(1n);
    expect(reportSubmitted(base)).toBe(base);
  });
});

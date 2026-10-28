import { describe, expect, it } from "vitest";
import { FIXTURES } from "@/lib/mocks";
import { decodeAttestation, encodeAttestation, resolveReportHash } from "../attest";
import { attestationUrl, canAttest, classifyAttestError, fieldsFor, reportHashOf, SCHEMA } from "../rules";

const BLOCK = FIXTURES["DEMO-ILLICIT-01"]!;

describe("canAttest", () => {
  it("allows found wallets with ALLOW, WARN or BLOCK", () => {
    for (const k of ["DEMO-ILLICIT-01", "DEMO-BORDERLINE-03", "DEMO-LICIT-02"]) expect(canAttest(FIXTURES[k]!)).toBe(true);
  });
  it("refuses UNKNOWN / not_in_dataset and error results", () => {
    expect(canAttest(FIXTURES["DEMO-NOTFOUND-04"]!)).toBe(false);
    expect(canAttest({ ...BLOCK, status: "error" })).toBe(false);
    expect(canAttest({ ...BLOCK, riskScore: null })).toBe(false);
  });
});

describe("fieldsFor", () => {
  it("maps the response and clamps the score into uint8 range", () => {
    expect(fieldsFor(BLOCK, "0x" + "ab".repeat(32))).toEqual({ subjectAddress: "DEMO-ILLICIT-01", chain: "bitcoin", riskScore: 91, verdict: "BLOCK", reportHash: "0x" + "ab".repeat(32) });
    expect(fieldsFor({ ...BLOCK, riskScore: 140 }, "0x0").riskScore).toBe(100);
    expect(fieldsFor({ ...BLOCK, riskScore: -3 }, "0x0").riskScore).toBe(0);
  });
});

describe("report hash selection", () => {
  it("uses the backend hash when it is well formed", () => {
    expect(reportHashOf(BLOCK)).toBe(BLOCK.reportHash);
    expect(reportHashOf({ ...BLOCK, reportHash: "nope" })).toBeNull();
    expect(reportHashOf({ ...BLOCK, reportHash: undefined })).toBeNull();
  });
  it("recomputes the identical hash in the browser when the backend sent none", async () => {
    const without = { ...BLOCK };
    delete without.reportHash;
    expect(await resolveReportHash(without)).toBe(BLOCK.reportHash);
    expect(await resolveReportHash(BLOCK)).toBe(BLOCK.reportHash);
  });
});

describe("encodeAttestation", () => {
  it("round-trips through the schema encoder", () => {
    const f = fieldsFor(BLOCK, BLOCK.reportHash!);
    const data = encodeAttestation(f);
    expect(data).toMatch(/^0x[0-9a-f]+$/);
    expect(decodeAttestation(data)).toEqual(f);
  });
  it("uses the documented schema string", () => {
    expect(SCHEMA).toBe("string subjectAddress,string chain,uint8 riskScore,string verdict,bytes32 reportHash");
  });
});

describe("classifyAttestError", () => {
  it.each([
    [{ code: "ACTION_REJECTED", message: "user rejected action" }, "rejected"],
    [{ code: 4001, message: "User rejected the request." }, "rejected"],
    [{ name: "UserRejectedRequestError", shortMessage: "User rejected the request." }, "rejected"],
    [{ code: "INSUFFICIENT_FUNDS", message: "insufficient funds for intrinsic transaction cost" }, "insufficient_funds"],
    [new Error("The total cost (gas * gas fee + value) exceeds the balance of the account"), "insufficient_funds"],
    [{ message: "chain mismatch: the current chain does not match the target chain" }, "wrong_network"],
    [{ cause: { message: "InvalidSchema()" } }, "schema"],
    [new Error("boom"), "other"],
    [undefined, "other"],
    ["weird string", "other"],
  ])("%o -> %s", (e, kind) => {
    expect(classifyAttestError(e).kind).toBe(kind);
  });
  it("returns a message key for each kind", () => {
    expect(classifyAttestError({ code: 4001 }).messageKey).toBe("web3.error.rejected");
    expect(classifyAttestError(new Error("x")).messageKey).toBe("web3.error.other");
  });
});

describe("attestationUrl", () => {
  it("points at easscan on Base Sepolia", () => {
    expect(attestationUrl("0xabc")).toBe("https://base-sepolia.easscan.org/attestation/view/0xabc");
  });
});

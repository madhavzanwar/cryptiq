import { computeReportHash, type Keccak256Utf8 } from "@/lib/api/reportHash";
import type { CheckResponse } from "@/lib/api/types";
import { fieldsFor, reportHashOf, type AttestFields } from "./rules";

/**
 * Pure verification logic (no ethers, no network): the keccak function is passed in. Used by the Verify button
 * and by the pre-attestation guard. "Match" is only ever returned after a real comparison of real values.
 */

export type LocalHashCheck =
  | { outcome: "match"; local: string; backend: string }
  | { outcome: "mismatch"; local: string; backend: string }
  /** The backend sent no (valid) reportHash: nothing to compare against, so this is NOT a match. */
  | { outcome: "no_backend_hash"; local: string };

/** Recomputes the report hash from the evidence in `result` and compares it with the backend's `reportHash`. */
export function checkLocalHash(result: CheckResponse, keccak: Keccak256Utf8): LocalHashCheck {
  const local = computeReportHash(result, keccak);
  const backend = reportHashOf(result);
  if (backend === null) return { outcome: "no_backend_hash", local };
  return { outcome: local === backend ? "match" : "mismatch", local, backend };
}

export type FieldName = keyof AttestFields;
const FIELD_NAMES: FieldName[] = ["subjectAddress", "chain", "riskScore", "verdict", "reportHash"];

export interface OnChainMeta {
  /** True when the attestation was revoked (revocationTime > 0). */
  revoked?: boolean;
}

export interface OnChainComparison {
  /** "match" only if every field agrees and the attestation is not revoked. */
  outcome: "match" | "mismatch" | "revoked";
  fields: Record<FieldName, boolean>;
  mismatched: FieldName[];
  /** The hash recomputed in the browser from the current result. */
  local: string;
}

/**
 * Compares what is stored on-chain (decoded attestation data) with the current result: Bitcoin address, chain,
 * risk score, verdict and report hash. The report hash must equal the hash recomputed in the browser AND, when the
 * backend sent one, the backend's hash.
 */
export function compareOnChain(
  result: CheckResponse,
  onChain: AttestFields,
  keccak: Keccak256Utf8,
  meta: OnChainMeta = {},
): OnChainComparison {
  const local = computeReportHash(result, keccak);
  const backend = reportHashOf(result);
  const expected = fieldsFor(result, local);
  const stored = onChain.reportHash.toLowerCase();
  const fields: Record<FieldName, boolean> = {
    subjectAddress: onChain.subjectAddress === expected.subjectAddress,
    chain: onChain.chain === expected.chain,
    riskScore: onChain.riskScore === expected.riskScore,
    verdict: onChain.verdict === expected.verdict,
    reportHash: stored === local && (backend === null || backend === local),
  };
  const mismatched = FIELD_NAMES.filter((n) => !fields[n]);
  const outcome = meta.revoked ? "revoked" : mismatched.length === 0 ? "match" : "mismatch";
  return { outcome, fields, mismatched, local };
}

export type VerifyErrorKind = "network" | "not_found" | "other";

export class VerifyError extends Error {
  readonly kind: VerifyErrorKind;
  constructor(kind: VerifyErrorKind, message: string = kind) {
    super(message);
    this.name = "VerifyError";
    this.kind = kind;
  }
}

/** Turns any failure while reading the chain into one of three user-facing cases. */
export function classifyVerifyError(e: unknown): VerifyErrorKind {
  if (e instanceof VerifyError) return e.kind;
  const text = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  if (/fetch|network|timeout|timed out|ECONN|ENOTFOUND|SERVER_ERROR|failed to detect|could not coalesce|503|502|429/i.test(text))
    return "network";
  return "other";
}

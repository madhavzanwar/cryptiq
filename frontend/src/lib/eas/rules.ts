import type { CheckResponse } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n";
import { EASSCAN_URL } from "@/lib/env";

/**
 * Light, dependency-free attestation rules (safe to import from the main bundle). The heavy part
 * (SchemaEncoder, EAS contract call) lives in ./attest.ts and is loaded only when the user signs.
 */

/** The EAS schema the team registers once at https://base-sepolia.easscan.org/schema/create */
export const SCHEMA = "string subjectAddress,string chain,uint8 riskScore,string verdict,bytes32 reportHash";

export interface AttestFields {
  /** The checked Bitcoin address (the recipient of the attestation is the user's EVM address instead). */
  subjectAddress: string;
  chain: string;
  /** 0-100, fits uint8. */
  riskScore: number;
  verdict: string;
  /** 0x + 32 bytes hex. */
  reportHash: string;
}

/** Results we attest: found wallets with a verdict and a score. UNKNOWN / not_in_dataset have no evidence. */
export function canAttest(result: CheckResponse): boolean {
  return result.status === "ok" && result.verdict !== "UNKNOWN" && result.riskScore !== null;
}

/** `result.reportHash` when the backend sent one; otherwise the caller must compute it (see attest.ts). */
export function reportHashOf(result: CheckResponse): string | null {
  return result.reportHash && /^0x[0-9a-fA-F]{64}$/.test(result.reportHash)
    ? result.reportHash.toLowerCase()
    : null;
}

export function fieldsFor(result: CheckResponse, reportHash: string): AttestFields {
  const score = Math.round(result.riskScore ?? 0);
  return {
    subjectAddress: result.address,
    chain: result.chain,
    riskScore: Math.min(100, Math.max(0, score)),
    verdict: result.verdict,
    reportHash,
  };
}

export const attestationUrl = (uid: string): string => `${EASSCAN_URL}/attestation/view/${uid}`;

export type AttestErrorKind = "rejected" | "wrong_network" | "insufficient_funds" | "schema" | "other";

const KEYS: Record<AttestErrorKind, MessageKey> = {
  rejected: "web3.error.rejected",
  wrong_network: "web3.error.wrongNetwork",
  insufficient_funds: "web3.error.funds",
  schema: "web3.error.schema",
  other: "web3.error.other",
};

/** Flattens an unknown thrown value (ethers, viem, wagmi, plain) into searchable text. */
function describe(e: unknown, depth = 0): string {
  if (e === null || e === undefined || depth > 4) return "";
  if (typeof e === "string") return e;
  if (typeof e === "number") return String(e);
  if (typeof e !== "object") return "";
  const o = e as Record<string, unknown>;
  return ["code", "name", "message", "shortMessage", "reason", "details"]
    .map((k) => describe(o[k], depth + 1))
    .concat(describe(o.cause, depth + 1), describe(o.info, depth + 1), describe(o.error, depth + 1))
    .join(" ");
}

/** Maps any failure to one of five friendly cases (EN/HI text lives in the web3 messages). */
export function classifyAttestError(e: unknown): { kind: AttestErrorKind; messageKey: MessageKey } {
  const text = describe(e);
  let kind: AttestErrorKind = "other";
  if (
    /ACTION_REJECTED|UserRejectedRequest|user rejected|user denied|rejected the request|request rejected|\b4001\b/i.test(
      text,
    )
  )
    kind = "rejected";
  else if (
    /INSUFFICIENT_FUNDS|insufficient funds|exceeds the balance|gas required exceeds|InsufficientFunds/i.test(
      text,
    )
  )
    kind = "insufficient_funds";
  else if (
    /chain mismatch|wrong network|does not match the target chain|ChainMismatch|network changed|NETWORK_ERROR|unsupported chain|ChainNotConfigured/i.test(
      text,
    )
  )
    kind = "wrong_network";
  else if (/InvalidSchema|schema not found|unknown schema|SchemaNotFound/i.test(text)) kind = "schema";
  return { kind, messageKey: KEYS[kind] };
}

import { computeReportHash } from "@/lib/api/reportHash";
import type { CheckResponse } from "@/lib/api/types";
import { SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { fieldsFor, reportHashOf, SCHEMA, type AttestFields } from "./rules";

/** Heavy half of the attestation code: loaded with `await import("@/lib/eas/attest")` only on click. */

export function encodeAttestation(fields: AttestFields): string {
  const encoder = new SchemaEncoder(SCHEMA);
  return encoder.encodeData([
    { name: "subjectAddress", value: fields.subjectAddress, type: "string" },
    { name: "chain", value: fields.chain, type: "string" },
    { name: "riskScore", value: fields.riskScore, type: "uint8" },
    { name: "verdict", value: fields.verdict, type: "string" },
    { name: "reportHash", value: fields.reportHash, type: "bytes32" },
  ]);
}

/** Inverse of encodeAttestation (used by tests and by anyone verifying an attestation). */
export function decodeAttestation(data: string): AttestFields {
  const out = new SchemaEncoder(SCHEMA).decodeData(data);
  const get = (name: string): unknown => out.find((i) => i.name === name)?.value.value;
  return {
    subjectAddress: String(get("subjectAddress")),
    chain: String(get("chain")),
    riskScore: Number(get("riskScore")),
    verdict: String(get("verdict")),
    reportHash: String(get("reportHash")),
  };
}

/** The backend's hash when present, else recomputed in the browser from the evidence (docs/api-contract.md). */
export async function resolveReportHash(result: CheckResponse): Promise<string> {
  const given = reportHashOf(result);
  if (given) return given;
  const { keccak256, toUtf8Bytes } = await import("ethers");
  return computeReportHash(result, (s) => keccak256(toUtf8Bytes(s)));
}

export interface SubmitOptions {
  signer: TransactionSigner;
  /** EAS contract address (Base Sepolia predeploy). */
  contract: string;
  schemaUid: string;
  /** The connected user's EVM address. */
  recipient: string;
  result: CheckResponse;
}

/** Signs and sends the attestation, waits for the transaction and returns the attestation UID. */
export async function submitAttestation({
  signer,
  contract,
  schemaUid,
  recipient,
  result,
}: SubmitOptions): Promise<string> {
  const { EAS } = await import("@ethereum-attestation-service/eas-sdk");
  const fields = fieldsFor(result, await resolveReportHash(result));
  const eas = new EAS(contract);
  eas.connect(signer);
  const tx = await eas.attest({
    schema: schemaUid,
    data: { recipient, expirationTime: 0n, revocable: true, data: encodeAttestation(fields) },
  });
  return tx.wait();
}

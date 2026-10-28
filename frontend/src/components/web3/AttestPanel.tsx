"use client";

import type { CheckResponse } from "@/lib/api";

/**
 * STUB (owned by the web3 agent). Contract with the check page:
 *   <AttestPanel result={checkResponse} historyId={optionalHistoryEntryId} />
 * It renders "Keep proof on-chain" and creates an EAS attestation on Base Sepolia.
 */
export function AttestPanel(_props: { result: CheckResponse; historyId?: string }) {
  return null;
}

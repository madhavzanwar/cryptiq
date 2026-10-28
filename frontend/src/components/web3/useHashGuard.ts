"use client";

import type { CheckResponse } from "@/lib/api/types";
import { keccakUtf8 } from "@/lib/eas/keccak";
import { checkLocalHash, type LocalHashCheck } from "@/lib/eas/verify";
import { useMemo } from "react";

/**
 * Recomputes the report hash from the result and compares it with the backend's, on every result. The attest
 * button is disabled while this reports "mismatch" (a wrong hash must never be written on-chain).
 */
export function useHashGuard(result: CheckResponse): LocalHashCheck {
  return useMemo(() => checkLocalHash(result, keccakUtf8), [result]);
}

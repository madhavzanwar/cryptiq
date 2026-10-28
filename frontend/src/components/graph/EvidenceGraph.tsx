"use client";

import type { CheckResponse } from "@/lib/api";

/**
 * STUB (owned by the graph agent). Contract with the check page:
 *   <EvidenceGraph result={checkResponse} />
 * It renders the force graph, controls, legend, node drawer and the "Graph as a list" table.
 */
export function EvidenceGraph(_props: { result: CheckResponse }) {
  return null;
}

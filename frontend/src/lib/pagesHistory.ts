import type { Verdict } from "@/lib/api/types";
import type { HistoryEntry } from "@/lib/stores/history";

export type VerdictFilter = "all" | Verdict;

/** Case-insensitive substring search on the address, plus an optional verdict filter. Newest first. */
export function filterHistory(entries: HistoryEntry[], opts: { query: string; verdict: VerdictFilter }): HistoryEntry[] {
  const q = opts.query.trim().toLowerCase();
  return entries
    .filter((e) => (opts.verdict === "all" ? true : e.result.verdict === opts.verdict))
    .filter((e) => (q === "" ? true : e.result.address.toLowerCase().includes(q)))
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** JSON for "Export JSON": the stored results only (no audio is ever stored). */
export function exportHistoryJson(entries: HistoryEntry[]): string {
  return JSON.stringify(
    entries.map((e) => ({ id: e.id, at: e.at, attestationUid: e.attestationUid ?? null, result: e.result })),
    null,
    2,
  );
}

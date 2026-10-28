import type { CheckResponse, Lang } from "@/lib/api/types";
import { translate } from "@/lib/i18n";
import { VERDICT_META } from "@/lib/verdict";

/**
 * Plain-text summary used by "Share summary": verdict, score, hops and the limitation lines.
 * Pure, so it can be tested and reused by the permalink page.
 */
export function buildSummary(result: CheckResponse, lang: Lang): string {
  const verdict = translate(lang, VERDICT_META[result.verdict].word);
  const lines = [translate(lang, "check.summary.line", { verdict, address: result.address })];
  lines.push(result.riskScore === null ? translate(lang, "check.summary.scoreNa") : translate(lang, "check.summary.score", { n: result.riskScore }));
  if (result.status === "ok") {
    lines.push(result.hopsToNearestIllicit === null ? translate(lang, "check.summary.hopsNone") : translate(lang, "check.summary.hops", { n: result.hopsToNearestIllicit }));
  }
  lines.push(translate(lang, VERDICT_META[result.verdict].line));
  lines.push(translate(lang, "honesty.signal"), translate(lang, "honesty.dataset"));
  return lines.join("\n");
}

/** `cryptiq-report-<first 8 chars of the address>.json`, safe for file systems. */
export function reportFileName(address: string): string {
  const short = address.replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "wallet";
  return `cryptiq-report-${short}.json`;
}

/** Triggers a browser download of `text` as a file (client only). */
export function downloadText(fileName: string, text: string, type = "application/json"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Toggle } from "@/components/pages/Toggle";
import { useSaveHistory } from "@/components/pages/useSaveHistory";
import { Alert, Button, Card, EmptyState, Segmented, VerdictBadge } from "@/components/ui";
import type { Verdict } from "@/lib/api/types";
import { shortAddress } from "@/lib/address/validate";
import { EASSCAN_URL } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { exportHistoryJson, filterHistory, type VerdictFilter } from "@/lib/pagesHistory";
import { downloadText } from "@/lib/pagesDownload";
import { formatDateTime } from "@/lib/pagesTime";
import { VERDICT_META } from "@/lib/verdict";
import { useHistory, type HistoryEntry } from "@/lib/stores/history";
import { Download, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const VERDICTS: Verdict[] = ["ALLOW", "WARN", "BLOCK", "UNKNOWN"];

const linkBtn =
  "inline-flex min-h-11 items-center justify-center rounded-button border border-carbon px-[13px] text-small transition-[background-color,color] duration-[120ms] ease-out hover:bg-carbon hover:text-pure-white";

function Proof({ entry }: { entry: HistoryEntry }) {
  const { t } = useT();
  if (!entry.attestationUid) return <span className="text-ash-gray">{t("history.none")}</span>;
  return (
    <a className="underline underline-offset-4" href={`${EASSCAN_URL}/attestation/view/${entry.attestationUid}`} target="_blank" rel="noopener noreferrer">
      {t("history.attestation")}
    </a>
  );
}

/** /history: privacy-first. Off by default; on = saved in this browser only, never uploaded. */
export function HistoryView() {
  const { t, lang } = useT();
  const { saveHistory, setSaveHistory } = useSaveHistory();
  const entries = useHistory((s) => s.entries);
  const remove = useHistory((s) => s.remove);
  const clear = useHistory((s) => s.clear);
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState<VerdictFilter>("all");
  const [confirmAll, setConfirmAll] = useState(false);

  const filtered = useMemo(() => filterHistory(entries, { query, verdict }), [entries, query, verdict]);
  const cells = (e: HistoryEntry) => {
    const r = e.result;
    return {
      score: r.riskScore === null ? t("history.na") : String(r.riskScore),
      hops: r.status !== "ok" ? t("history.na") : r.hopsToNearestIllicit === null ? t("history.none") : String(r.hopsToNearestIllicit),
    };
  };

  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("history.eyebrow")} title={t("history.title")} intro={t("history.intro")} />

      <Card className="mb-[35px]">
        <Toggle checked={saveHistory} onChange={setSaveHistory} label={t("history.toggle")} help={t("history.toggle.help")} />
      </Card>

      {!saveHistory && (
        <div className="grid gap-[18px]">
          <Alert tone="info" title={t("history.off.title")}>{t("history.off.body")}</Alert>
          <EmptyState icon={<HistoryIcon aria-hidden />} title={t("history.empty.title")}>{t("history.empty.body")}</EmptyState>
        </div>
      )}

      {saveHistory && entries.length === 0 && (
        <EmptyState icon={<HistoryIcon aria-hidden />} title={t("history.empty.title")} action={<Button variant="green" size="lg" href="/check">{t("history.empty.cta")}</Button>}>
          {t("history.empty.body")}
        </EmptyState>
      )}

      {saveHistory && entries.length > 0 && (
        <div className="grid gap-[26px]">
          <div className="flex flex-wrap items-end gap-[18px]">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="history-search" className="mb-[9px] block text-body">{t("history.search")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-[18px] size-4 -translate-y-1/2 text-ash-gray" aria-hidden />
                <input
                  id="history-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="mono h-[53px] w-full rounded-input border border-carbon bg-plaster pr-[18px] pl-[44px] text-body-lg hover:border-obsidian"
                />
              </div>
            </div>
            <Segmented<VerdictFilter>
              label={t("history.filter")}
              value={verdict}
              onChange={setVerdict}
              options={[{ value: "all", label: t("history.filter.all") }, ...VERDICTS.map((v) => ({ value: v as VerdictFilter, label: t(VERDICT_META[v].word) }))]}
              className="flex-wrap"
            />
          </div>

          <div className="flex flex-wrap items-center gap-[13px]">
            <span className="text-body text-ash-gray" aria-live="polite">{t("history.count", { n: entries.length })}</span>
            <Button variant="ghost" onClick={() => downloadText("cryptiq-history.json", exportHistoryJson(entries), "application/json")}>
              <Download className="size-4" aria-hidden />
              {t("history.export")}
            </Button>
            {confirmAll ? (
              <span className="inline-flex flex-wrap items-center gap-[9px]" role="group" aria-label={t("history.deleteAll.confirm")}>
                <span className="text-body">{t("history.deleteAll.confirm")}</span>
                <Button variant="black" onClick={() => { clear(); setConfirmAll(false); }}>{t("history.deleteAll.yes")}</Button>
                <Button variant="ghost" onClick={() => setConfirmAll(false)}>{t("action.cancel")}</Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmAll(true)}>
                <Trash2 className="size-4" aria-hidden />
                {t("history.deleteAll")}
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-card border border-carbon bg-pure-white p-[26px] text-ash-gray">{t("history.noMatch")}</p>
          ) : (
            <>
              {/* desktop: table */}
              <div className="hidden overflow-x-auto rounded-card border border-carbon bg-pure-white md:block">
                <table className="w-full border-collapse text-body-lg">
                  <caption className="sr-only">{t("history.title")}</caption>
                  <thead>
                    <tr className="bg-bone text-left text-small text-ash-gray">
                      <th scope="col" className="px-[18px] py-[13px] font-medium">{t("history.col.time")}</th>
                      <th scope="col" className="px-[18px] py-[13px] font-medium">{t("history.col.address")}</th>
                      <th scope="col" className="px-[18px] py-[13px] font-medium">{t("history.col.verdict")}</th>
                      <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("history.col.score")}</th>
                      <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("history.col.hops")}</th>
                      <th scope="col" className="px-[18px] py-[13px] font-medium">{t("history.col.proof")}</th>
                      <th scope="col" className="px-[18px] py-[13px] font-medium">{t("history.col.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const c = cells(e);
                      return (
                        <tr key={e.id} className="border-t border-bone hover:bg-plaster">
                          <td className="p-[18px] whitespace-nowrap text-body">{formatDateTime(e.at, lang)}</td>
                          <td className="p-[18px]"><span className="mono text-small" title={e.result.address}>{shortAddress(e.result.address)}</span></td>
                          <td className="p-[18px]"><VerdictBadge verdict={e.result.verdict} size="sm" /></td>
                          <td className="p-[18px] text-right tabular-nums">{c.score}</td>
                          <td className="p-[18px] text-right tabular-nums">{c.hops}</td>
                          <td className="p-[18px] text-body"><Proof entry={e} /></td>
                          <td className="p-[18px]">
                            <div className="flex flex-wrap gap-[9px]">
                              <Link className={linkBtn} href={`/r/${e.id}`}>{t("history.open")}</Link>
                              <button type="button" className={linkBtn} onClick={() => remove(e.id)} aria-label={`${t("history.delete")} ${e.result.address}`}>{t("history.delete")}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* phone: cards */}
              <ul className="grid gap-[13px] md:hidden">
                {filtered.map((e) => {
                  const c = cells(e);
                  return (
                    <li key={e.id} className="grid gap-[13px] rounded-card border border-carbon bg-pure-white p-[18px]">
                      <div className="flex items-center justify-between gap-[13px]">
                        <VerdictBadge verdict={e.result.verdict} size="sm" />
                        <span className="text-small text-ash-gray">{formatDateTime(e.at, lang)}</span>
                      </div>
                      <p className="mono text-small" title={e.result.address}>{shortAddress(e.result.address, 10, 8)}</p>
                      <p className="text-body text-ash-gray">{t("history.col.score")}: <span className="text-carbon tabular-nums">{c.score}</span> · {t("history.col.hops")}: <span className="text-carbon tabular-nums">{c.hops}</span></p>
                      {e.attestationUid && <p className="text-body"><Proof entry={e} /></p>}
                      <div className="flex gap-[9px]">
                        <Link className={linkBtn} href={`/r/${e.id}`}>{t("history.open")}</Link>
                        <button type="button" className={linkBtn} onClick={() => remove(e.id)} aria-label={`${t("history.delete")} ${e.result.address}`}>{t("history.delete")}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Tabs } from "@/components/ui/Tabs";
import { evidenceFor } from "@/lib/api/reportHash";
import type { CheckResponse } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { Download } from "lucide-react";
import { downloadText, reportFileName } from "./summary";

const ROWS = ["hop1", "hop2", "hop3"] as const;

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-[18px] gap-y-1 border-b border-bone py-[9px] last:border-0">
      <dt className="text-ash-gray">{k}</dt>
      <dd className={mono ? "mono text-small" : ""}>{v}</dd>
    </div>
  );
}

/** Evidence JSON (copy + download), model info, limitations and the neighbour counts. */
export function DetailsTabs({ result, className }: { result: CheckResponse; className?: string }) {
  const { t } = useT();
  const evidence = JSON.stringify({ ...evidenceFor(result), ...(result.reportHash ? { reportHash: result.reportHash } : {}) }, null, 2);
  const limits = [...new Set([...result.limitations, t("honesty.signal"), t("honesty.dataset")])];
  const f1 = result.model.illicitF1Test;

  return (
    <Card className={className}>
      <h2 className="sub mb-[18px]">{t("check.details.label")}</h2>
      <Tabs
        label={t("check.details.label")}
        items={[
          {
            id: "evidence",
            label: t("check.details.evidence"),
            panel: (
              <div className="grid gap-[13px]">
                <p className="text-small text-ash-gray">{t("check.details.evidenceNote")}</p>
                <CodeBlock code={evidence} label={t("check.details.evidence")} className="max-h-[360px] overflow-auto" />
                <div>
                  <Button variant="ghost" onClick={() => downloadText(reportFileName(result.address), JSON.stringify(result, null, 2))}>
                    <Download className="size-4" aria-hidden />
                    {t("check.details.download")}
                  </Button>
                </div>
              </div>
            ),
          },
          {
            id: "model",
            label: t("check.details.model"),
            panel: (
              <dl className="text-body">
                <Row k={t("check.model.name")} v={result.model.name} mono />
                {typeof f1 === "number" && <Row k={t("check.model.f1")} v={f1.toFixed(3)} />}
                <Row k={t("check.model.engine")} v={result.engine ?? "-"} />
                <Row k={t("check.model.query")} v={result.tigergraph.queryName} mono />
                <Row k={t("check.model.ms")} v={`${Math.round(result.tigergraph.ms)} ms`} />
                {result.graphFeatures.pagerank !== undefined && <Row k={t("check.model.pagerank")} v={result.graphFeatures.pagerank.toExponential(2)} />}
                {result.graphFeatures.componentSize !== undefined && <Row k={t("check.model.component")} v={String(result.graphFeatures.componentSize)} />}
                <Row k={t("check.model.dataset")} v={result.isMock ? t("check.model.dataset.synthetic") : t("check.model.dataset.elliptic")} />
              </dl>
            ),
          },
          {
            id: "limits",
            label: t("check.details.limits"),
            panel: (
              <ul className="grid gap-[9px] text-body">
                {limits.map((l) => (
                  <li key={l} className="flex gap-[11px]">
                    <span aria-hidden className="mt-[7px] size-[7px] flex-none rotate-45 bg-carbon" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: "neighbours",
            label: t("check.details.neighbours"),
            panel: (
              <div className="overflow-x-auto rounded-card border border-carbon">
                <table className="w-full border-collapse text-body">
                  <thead>
                    <tr className="bg-bone text-left text-small text-ash-gray">
                      <th className="px-[18px] py-[13px] font-medium" scope="col" />
                      <th className="px-[18px] py-[13px] text-right font-medium" scope="col">{t("check.neighbours.illicit")}</th>
                      <th className="px-[18px] py-[13px] text-right font-medium" scope="col">{t("check.neighbours.licit")}</th>
                      <th className="px-[18px] py-[13px] text-right font-medium" scope="col">{t("check.neighbours.unknown")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r, i) => {
                      const c = result.neighbors[r];
                      return (
                        <tr key={r} className="border-t border-bone">
                          <th scope="row" className="px-[18px] py-[13px] text-left font-medium">{t("check.neighbours.hop", { n: i + 1 })}</th>
                          {c ? (
                            <>
                              <td className="px-[18px] py-[13px] text-right tabular-nums">{c.illicit}</td>
                              <td className="px-[18px] py-[13px] text-right tabular-nums">{c.licit}</td>
                              <td className="px-[18px] py-[13px] text-right tabular-nums">{c.unknown}</td>
                            </>
                          ) : (
                            <td colSpan={3} className="px-[18px] py-[13px] text-right text-ash-gray">{t("check.neighbours.notComputed")}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}

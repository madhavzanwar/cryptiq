"use client";

import type { BenchmarkModelRow } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";

const f = (v: number) => v.toFixed(3);

/** Baseline vs with-graph-features: illicit-class F1, precision, recall (as returned by the API). */
export function ModelTable({ models }: { models: BenchmarkModelRow[] }) {
  const { t } = useT();
  const label = (name: BenchmarkModelRow["name"]) => (name === "baseline" ? t("bench.models.baseline") : t("bench.models.withGraph"));
  return (
    <div className="overflow-x-auto rounded-card border border-carbon bg-pure-white">
      <table className="w-full border-collapse text-body-lg">
        <caption className="sr-only">{t("bench.models.title")}</caption>
        <thead>
          <tr className="bg-bone text-left text-small text-ash-gray">
            <th scope="col" className="px-[18px] py-[13px] font-medium">{t("bench.models.name")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.models.f1")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.models.precision")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.models.recall")}</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.name} className="border-t border-bone">
              <th scope="row" className="p-[18px] text-left font-medium">{label(m.name)}</th>
              <td className="p-[18px] text-right tabular-nums">{f(m.illicitF1)}</td>
              <td className="p-[18px] text-right tabular-nums">{f(m.precision)}</td>
              <td className="p-[18px] text-right tabular-nums">{f(m.recall)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

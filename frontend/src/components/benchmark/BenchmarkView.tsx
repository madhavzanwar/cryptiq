"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Alert, Button, EmptyState, Skeleton } from "@/components/ui";
import { messageFor } from "@/lib/api/errors";
import type { BenchmarkModelRow, BenchmarkRow } from "@/lib/api/types";
import { USE_MOCKS } from "@/lib/env";
import { useBenchmark } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { buildBenchmarkCsv, formatPercentChange, graphFeaturesHelped, percentChange, pickMethods } from "@/lib/pagesBenchmark";
import { downloadText } from "@/lib/pagesDownload";
import { formatDateTime } from "@/lib/pagesTime";
import { ChartColumn, Download } from "lucide-react";
import { CompareBars, type BarDatum } from "./CompareBars";
import { ModelTable } from "./ModelTable";
import { RunBenchmark } from "./RunBenchmark";

/** The run control is a developer/demo tool; the public site only shows results. */
const CAN_RUN = USE_MOCKS || process.env.NODE_ENV === "development";

const n0 = (v: number) => Math.round(v).toLocaleString("en-US");

interface Measured {
  measuredAt?: string;
  sampleSize: number;
  rows: BenchmarkRow[];
  models: BenchmarkModelRow[];
}

function MethodTable({ rows }: { rows: BenchmarkRow[] }) {
  const { t } = useT();
  const { raw, graph } = pickMethods(rows);
  const change = (k: "inputTokens" | "latencyMs" | "accuracyPct") => (raw && graph ? formatPercentChange(percentChange(raw[k], graph[k])) : "n/a");
  const line = (r: BenchmarkRow, label: string) => (
    <tr key={r.method} className="border-t border-bone">
      <th scope="row" className="p-[18px] text-left font-medium">{label}</th>
      <td className="p-[18px] text-right tabular-nums">{n0(r.inputTokens)}</td>
      <td className="p-[18px] text-right tabular-nums">{n0(r.latencyMs)}</td>
      <td className="p-[18px] text-right tabular-nums">{r.accuracyPct.toFixed(1)}</td>
    </tr>
  );
  return (
    <div className="overflow-x-auto rounded-card border border-carbon bg-pure-white">
      <table className="w-full border-collapse text-body-lg">
        <caption className="sr-only">{t("bench.table.title")}</caption>
        <thead>
          <tr className="bg-bone text-left text-small text-ash-gray">
            <th scope="col" className="px-[18px] py-[13px] font-medium">{t("bench.col.method")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.col.tokens")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.col.latency")}</th>
            <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("bench.col.accuracy")}</th>
          </tr>
        </thead>
        <tbody>
          {raw && line(raw, t("bench.method.raw"))}
          {graph && line(graph, t("bench.method.graph"))}
          {raw && graph && (
            <tr className="border-t border-carbon bg-bone">
              <th scope="row" className="p-[18px] text-left font-semibold">{t("bench.row.change")}</th>
              <td className="p-[18px] text-right font-semibold tabular-nums">{change("inputTokens")}</td>
              <td className="p-[18px] text-right font-semibold tabular-nums">{change("latencyMs")}</td>
              <td className="p-[18px] text-right font-semibold tabular-nums">{change("accuracyPct")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Results({ data }: { data: Measured }) {
  const { t, lang } = useT();
  const { raw, graph } = pickMethods(data.rows);
  const helped = graphFeaturesHelped(data.models);

  const series = (pick: (r: BenchmarkRow) => number): BarDatum[] => [
    ...(raw ? [{ key: "raw", label: t("bench.method.raw"), value: pick(raw), tone: "raw" as const }] : []),
    ...(graph ? [{ key: "graph", label: t("bench.method.graph"), value: pick(graph), tone: "graph" as const }] : []),
  ];

  return (
    <div className="grid gap-[35px]">
      <p className="text-body-lg font-semibold" aria-live="polite">
        {data.measuredAt
          ? t("bench.measured", { time: formatDateTime(data.measuredAt, lang), n: data.sampleSize })
          : t("bench.measuredNoTime", { n: data.sampleSize })}
      </p>

      <div className="grid gap-[26px] lg:grid-cols-3">
        <CompareBars title={t("bench.chart.tokens")} hint={t("bench.chart.lower")} data={series((r) => r.inputTokens)} format={n0} />
        <CompareBars title={t("bench.chart.latency")} hint={t("bench.chart.lower")} data={series((r) => r.latencyMs)} format={n0} />
        <CompareBars title={t("bench.chart.accuracy")} hint={t("bench.chart.higher")} data={series((r) => r.accuracyPct)} format={(v) => `${v.toFixed(1)}%`} />
      </div>

      <section aria-labelledby="bench-table-h">
        <h2 id="bench-table-h" className="sub mb-[13px]">{t("bench.table.title")}</h2>
        <MethodTable rows={data.rows} />
      </section>

      {data.models.length > 0 && (
        <section aria-labelledby="bench-models-h">
          <h2 id="bench-models-h" className="sub mb-[13px]">{t("bench.models.title")}</h2>
          <ModelTable models={data.models} />
          {helped === false && <p className="measure mt-[13px] text-body text-ash-gray">{t("bench.caption.noGain")}</p>}
        </section>
      )}

      <div>
        <Button variant="ghost" onClick={() => downloadText("cryptiq-benchmark.csv", buildBenchmarkCsv(data), "text/csv")}>
          <Download className="size-4" aria-hidden />
          {t("bench.csv")}
        </Button>
      </div>

      <details className="rounded-card bg-bone p-[26px]">
        <summary className="cursor-pointer text-body-lg font-semibold">{t("bench.how.title")}</summary>
        <p className="measure mt-[13px] text-ash-gray">{t("bench.how.body")}</p>
      </details>
    </div>
  );
}

/** /benchmark: only numbers returned by GET /api/benchmark; "Not measured yet" when there are none. */
export function BenchmarkView() {
  const { t, lang } = useT();
  const q = useBenchmark();

  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("bench.eyebrow")} title={t("bench.title")} intro={t("bench.intro")} />

      {USE_MOCKS && (
        <Alert tone="warning" title={t("mock.sample")} className="mb-[35px]">
          {t("bench.mockBanner")}
        </Alert>
      )}

      <div className="grid gap-[35px]">
        {CAN_RUN && <RunBenchmark />}

        {q.isPending && (
          <div aria-busy="true" className="grid gap-[26px] lg:grid-cols-3">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
        )}

        {q.isError && (
          <Alert
            tone="error"
            title={t("bench.loadError")}
            action={<Button variant="ghost" onClick={() => void q.refetch()}>{t("action.retry")}</Button>}
          >
            {messageFor(q.error, lang).message}
          </Alert>
        )}

        {q.data?.status === "not_measured" && (
          <EmptyState icon={<ChartColumn aria-hidden />} title={t("bench.empty.title")}>
            <span className="block">{CAN_RUN ? t("bench.empty.body") : t("bench.empty.bodyPublic")}</span>
            <span className="mt-[7px] block text-small">{t("bench.empty.note")}</span>
          </EmptyState>
        )}

        {q.data?.status === "ok" && (
          <Results data={{ ...(q.data.measuredAt ? { measuredAt: q.data.measuredAt } : {}), sampleSize: q.data.sampleSize, rows: q.data.rows, models: q.data.models }} />
        )}
      </div>
    </div>
  );
}

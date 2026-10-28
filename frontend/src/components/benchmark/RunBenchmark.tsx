"use client";

import { Alert, Button, Card, Segmented } from "@/components/ui";
import { isApiError, messageFor } from "@/lib/api/errors";
import { api } from "@/lib/api/instance";
import type { BenchmarkJob } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

const SIZES = ["10", "25", "50"] as const;
type Size = (typeof SIZES)[number];

type RunState =
  | { kind: "idle" }
  | { kind: "running"; progress: number }
  | { kind: "done" }
  | { kind: "failed"; message?: string };

/**
 * Starts POST /api/benchmark/run and polls /api/benchmark/job/{id}. Only mounted in development / mock mode:
 * the public UI shows results and never starts runs (the backend also needs an admin token in production).
 */
export function RunBenchmark() {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const [size, setSize] = useState<Size>("25");
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [jobId, setJobId] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // poll the job once a second while it runs
  useEffect(() => {
    if (!jobId) return;
    const ctl = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        const job: BenchmarkJob = await api.benchmarkJob(jobId, { signal: ctl.signal });
        if (!alive.current) return;
        if (job.status === "running") setState({ kind: "running", progress: job.progress });
        else {
          window.clearInterval(timer);
          setJobId(null);
          if (job.status === "done") {
            setState({ kind: "done" });
            void qc.invalidateQueries({ queryKey: ["benchmark"] });
          } else setState({ kind: "failed", ...(job.error ? { message: job.error } : {}) });
        }
      } catch (e) {
        if (isApiError(e) && e.code === "aborted") return;
        window.clearInterval(timer);
        setJobId(null);
        if (alive.current) setState({ kind: "failed", message: messageFor(e, lang).message });
      }
    }, 1000);
    return () => {
      window.clearInterval(timer);
      ctl.abort();
    };
  }, [jobId, lang, qc]);

  const start = async () => {
    setState({ kind: "running", progress: 0 });
    try {
      const { jobId: id } = await api.runBenchmark(Number(size));
      if (alive.current) setJobId(id);
    } catch (e) {
      if (!alive.current) return;
      const forbidden = isApiError(e) && e.code === "forbidden";
      setState({ kind: "failed", message: forbidden ? t("bench.run.forbidden") : messageFor(e, lang).message });
    }
  };

  const running = state.kind === "running";
  const pct = running ? Math.round(state.progress * 100) : 0;

  return (
    <Card className="grid gap-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <h2 className="sub">{t("bench.run.title")}</h2>
          <p className="mt-[4px] text-small text-ash-gray">{t("bench.run.note")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-[13px]">
          <Segmented<Size> label={t("bench.run.size")} value={size} onChange={setSize} options={SIZES.map((s) => ({ value: s, label: s }))} />
          <Button variant="black" onClick={start} loading={running}>
            {t("bench.run.start")}
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        {running && (
          <div>
            <p className="mb-[7px] text-body">{t("bench.run.running", { pct })}</p>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t("bench.run.title")} className="h-[13px] rounded-full border border-carbon bg-plaster">
              <div className="h-full rounded-full bg-carbon transition-[width] duration-300 ease-emphasized" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {state.kind === "done" && <Alert tone="success">{t("bench.run.done")}</Alert>}
        {state.kind === "failed" && <Alert tone="error" title={t("bench.run.failed")}>{state.message}</Alert>}
      </div>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/cn";
import type { Verdict } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { METER_TICKS, VERDICT_META } from "@/lib/verdict";
import { useEffect, useState } from "react";

/** 0-100 meter: number + 13px track filled in the verdict colour, ticks at 30 and 70. "n/a" when the wallet is not in the dataset. */
export function RiskGauge({ score, verdict, size = "md" }: { score: number | null; verdict: Verdict; size?: "md" | "lg" }) {
  const { t } = useT();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score ?? 0)); // fill animates in from 0
    return () => cancelAnimationFrame(id);
  }, [score]);
  const meta = VERDICT_META[verdict];
  const numCls = size === "lg" ? "text-heading" : "text-heading-sm";
  const na = score === null;
  return (
    <div
      className="flex items-center gap-[18px]"
      {...(na ? { role: "img", "aria-label": `${t("check.gauge.label")}: ${t("check.gauge.na")}` } : { role: "meter", "aria-label": t("check.gauge.label"), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": score, "aria-valuetext": t("check.gauge.value", { n: score }) })}
    >
      <span className={cn("min-w-[1.6em] font-semibold leading-none", numCls)}>{na ? t("check.gauge.na") : score}</span>
      <div className="relative h-[13px] flex-1 rounded-input bg-plaster">
        {!na && (
          <div
            data-testid="gauge-fill"
            className={cn("absolute inset-y-0 left-0 rounded-input border border-carbon transition-[width] duration-[900ms] ease-emphasized motion-reduce:transition-none", meta.solid)}
            style={{ width: `${Math.max(0, Math.min(100, shown))}%` }}
          />
        )}
        {METER_TICKS.map((tick) => (
          <span key={tick} aria-hidden className="absolute -top-1 -bottom-1 w-px bg-carbon" style={{ left: `${tick}%` }} />
        ))}
      </div>
    </div>
  );
}

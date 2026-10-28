"use client";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { StepEvent } from "@/lib/api/types";
import { STEP_IDS, activeStepIndex } from "@/lib/hooks/checkFlow";
import { useT } from "@/lib/i18n/provider";
import { Check } from "lucide-react";

/** The five check steps (validate, graph, hops, score, explain). Labels come from the server stream when it sent them. */
export function ProgressSteps({ steps, className }: { steps: StepEvent[]; className?: string }) {
  const { t } = useT();
  const active = activeStepIndex(steps);
  const label = (id: (typeof STEP_IDS)[number]) => steps.find((s) => s.id === id)?.label ?? t(`check.step.${id}` as const);
  return (
    <ol aria-label={t("check.progress.aria")} className={cn("grid gap-[11px]", className)}>
      {STEP_IDS.map((id, i) => {
        const done = i < active;
        const current = i === active || (active === -1 && i === 0);
        return (
          <li key={id} aria-current={current ? "step" : undefined} className={cn("flex items-center gap-[13px] text-body-lg", !done && !current && "text-slate-gray")}>
            <span
              aria-hidden
              className={cn("inline-flex size-6 flex-none items-center justify-center rounded-full border", done ? "border-carbon bg-carbon text-pure-white" : current ? "border-carbon" : "border-ash-gray/50")}
            >
              {done ? <Check className="size-4" strokeWidth={2.5} /> : current ? <Spinner className="size-4" /> : null}
            </span>
            <span className={cn(current && "font-semibold text-carbon")}>{label(id)}</span>
          </li>
        );
      })}
    </ol>
  );
}

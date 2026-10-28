"use client";

import { cn } from "@/lib/cn";
import type { Verdict } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { VERDICT_META } from "@/lib/verdict";

/** Top reasons from the API (`topReasons`), one line each, with a small diamond in the verdict colour. */
export function ReasonsList({ reasons, verdict }: { reasons: string[]; verdict: Verdict }) {
  const { t } = useT();
  if (reasons.length === 0) return null;
  return (
    <div>
      <h3 className="mb-[9px] text-body font-semibold">{t("check.reasons.title")}</h3>
      <ul className="grid gap-[9px]">
        {reasons.map((r, i) => (
          <li key={`${i}-${r}`} className="flex gap-[11px] text-body">
            <span aria-hidden className={cn("mt-[7px] size-[7px] flex-none rotate-45", VERDICT_META[verdict].solid)} />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

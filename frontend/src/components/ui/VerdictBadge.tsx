"use client";

import { cn } from "@/lib/cn";
import type { Verdict } from "@/lib/api";
import { useT } from "@/lib/i18n/provider";
import { VERDICT_META } from "@/lib/verdict";
import { CircleCheck, CircleHelp, ShieldX, TriangleAlert } from "lucide-react";

const ICONS = { "check-circle": CircleCheck, "alert-triangle": TriangleAlert, "shield-x": ShieldX, "help-circle": CircleHelp } as const;

/** Verdict = icon + word on a muted tint. `size="lg"` is the big chip in the verdict card. */
export function VerdictBadge({ verdict, size = "md", className }: { verdict: Verdict; size?: "sm" | "md" | "lg"; className?: string }) {
  const { t } = useT();
  const meta = VERDICT_META[verdict];
  const Icon = ICONS[meta.icon];
  const sizes = {
    sm: "gap-[7px] rounded-tag px-[11px] py-[5px] text-small [&_svg]:size-4",
    md: "gap-[9px] rounded-card px-[13px] py-[7px] text-subheading [&_svg]:size-6",
    lg: "gap-[13px] rounded-card py-[9px] pr-[26px] pl-[18px] text-heading [&_svg]:size-11",
  } as const;
  return (
    <span className={cn("inline-flex items-center font-semibold leading-[1.02]", meta.chip, sizes[size], className)}>
      <Icon aria-hidden strokeWidth={1.75} />
      {t(meta.word)}
    </span>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { useCredits } from "@/lib/stores/credits";
import { useUi } from "@/lib/stores/ui";
import { Coins } from "lucide-react";

/**
 * Credit meter: coin + number. The number slides in when it goes down. At 0 or 1 credit it turns into the
 * "Top up" state (block tint). Clicking opens the credits drawer. The balance is loaded by the top bar.
 */
export function CreditPill() {
  const { t } = useT();
  const balance = useCredits((s) => s.balance);
  const tick = useCredits((s) => s.tick);
  const openCredits = useUi((s) => s.openCredits);
  const low = balance !== null && balance <= 1;
  return (
    <button
      type="button"
      onClick={openCredits}
      aria-label={balance === null ? t("credits.label") : t("credits.aria", { n: balance })}
      data-low={low ? "" : undefined}
      className={cn(
        "credit inline-flex min-h-11 items-center gap-[9px] rounded-input border px-[13px] text-body transition-colors duration-[120ms] ease-out sm:px-[18px]",
        tick > 0 && "tick",
        low ? "border-block-ink bg-block-tint text-block-ink" : "border-carbon bg-pure-white hover:bg-bone",
      )}
    >
      <Coins className="size-[18px]" aria-hidden strokeWidth={1.75} />
      <span key={tick} className="n tabular-nums">
        {balance === null ? "–" : balance}
      </span>
      {low && <span className="hidden text-small sm:inline">{t("credits.topUp")}</span>}
    </button>
  );
}

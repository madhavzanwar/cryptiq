"use client";

import { Tag } from "@/components/ui";
import type { CreditPack } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { formatUsd } from "@/lib/pagesMoney";

/**
 * Credit Pack Card (DESIGN.md): white card, name, big credit count, price, test-mode tag.
 * Selected = 2px Carbon border + Bone fill + Sticker Yellow tag. A toggle button (aria-pressed).
 */
export function PackCard({ pack, selected, onSelect, compact = false }: { pack: CreditPack; selected: boolean; onSelect: () => void; compact?: boolean }) {
  const { t } = useT();
  const price = formatUsd(pack.priceUsd);
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={t("credits.pack.aria", { label: pack.label, n: pack.credits, price })}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-[13px] rounded-card text-left transition-[transform,background-color] duration-[320ms] ease-emphasized hover:-translate-y-[6px] motion-reduce:hover:translate-y-0",
        selected ? "border-2 border-carbon bg-bone" : "border border-carbon bg-pure-white",
        compact ? (selected ? "p-[17px]" : "p-[18px]") : selected ? "p-[25px]" : "p-[26px]",
      )}
    >
      <span className="sub">{pack.label}</span>
      <span className={cn("font-semibold tabular-nums", compact ? "text-heading-sm leading-none" : "text-[clamp(56px,7vw,84px)] leading-[0.9]")}>{pack.credits}</span>
      <span className="text-body text-ash-gray">
        {t("credits.pack.credits", { n: pack.credits })} · {price}
      </span>
      <Tag tone={selected ? "yellow" : "bone"}>{t("credits.pack.testMode")}</Tag>
      <span className="text-small font-semibold">{selected ? t("credits.pack.selected") : t("credits.pack.select")}</span>
    </button>
  );
}

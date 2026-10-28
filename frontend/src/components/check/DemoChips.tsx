"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { DemoWallet } from "@/lib/api/types";
import { useDemoWallets } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { VERDICT_META } from "@/lib/verdict";

const ORDER = ["BLOCK", "WARN", "ALLOW", "UNKNOWN"] as const;

/** One wallet per expected verdict first (BLOCK, WARN, ALLOW, UNKNOWN), then the rest, up to `max`. */
export function pickDemoWallets(wallets: DemoWallet[], max = 4): DemoWallet[] {
  const picked: DemoWallet[] = [];
  for (const v of ORDER) {
    const w = wallets.find((x) => x.expected === v);
    if (w) picked.push(w);
  }
  for (const w of wallets) if (picked.length < max && !picked.includes(w)) picked.push(w);
  return picked.slice(0, max);
}

/** Chip text: the API's note when it is short ("Known illicit (demo)"), otherwise "BLOCK · DEMO-w02271". */
export function demoLabel(w: DemoWallet, verdictWord: string): string {
  return w.note.length <= 30 ? w.note : `${verdictWord} · ${w.address}`;
}

/** "Try an example": chips from GET /api/demo-wallets (held-out test wallets). Clicking fills the field. */
export function DemoChips({ onPick, selected, disabled }: { onPick: (address: string) => void; selected?: string; disabled?: boolean }) {
  const { t } = useT();
  const { data, isPending } = useDemoWallets();
  const wallets = data ? pickDemoWallets(data.wallets) : [];
  if (!isPending && wallets.length === 0) return null;
  return (
    <div>
      <p className="mb-[9px] text-small text-ash-gray">{t("check.input.examples")}</p>
      <div className="flex flex-wrap gap-[9px]">
        {isPending
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[31px] w-[120px] rounded-tag" />)
          : wallets.map((w) => {
              const on = selected === w.address;
              return (
                <button
                  key={w.address}
                  type="button"
                  disabled={disabled}
                  title={w.address}
                  aria-pressed={on}
                  onClick={() => onPick(w.address)}
                  className={cn(
                    "inline-flex min-h-[31px] items-center rounded-tag border border-carbon px-[13px] py-[7px] text-small transition-[background-color,color,transform] duration-[120ms] ease-out hover:-translate-y-0.5 active:scale-[0.96] disabled:opacity-50",
                    on ? "bg-carbon text-pure-white" : "bg-pure-white hover:bg-bone",
                  )}
                >
                  {demoLabel(w, t(VERDICT_META[w.expected].word))}
                </button>
              );
            })}
      </div>
    </div>
  );
}

"use client";

import { Alert, Button, Skeleton, Tabs } from "@/components/ui";
import { messageFor } from "@/lib/api/errors";
import { useCreditsQuery } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { useCredits } from "@/lib/stores/credits";
import { useState } from "react";
import { CryptoInvoice } from "./CryptoInvoice";
import { DodoCheckout } from "./DodoCheckout";
import { PackCard } from "./PackCard";

/** Balance + credit packs + the two payment paths. `compact` is the drawer version. */
export function CreditsContent({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useT();
  const q = useCreditsQuery();
  const storeBalance = useCredits((s) => s.balance);
  const [selected, setSelected] = useState<string | null>(null);

  const balance = storeBalance ?? q.data?.balance ?? null;
  const packs = q.data?.packs ?? [];
  const pack = packs.find((p) => p.id === selected) ?? packs[0];

  return (
    <div className="grid gap-[26px]">
      <div>
        <p className="text-body text-ash-gray">{t("credits.balance")}</p>
        {balance === null ? (
          q.isError ? null : <Skeleton className="mt-[7px] h-[53px] w-[120px]" />
        ) : (
          <p className="mt-[4px] flex items-baseline gap-[13px]" aria-live="polite">
            <span className={cn("font-semibold tabular-nums", compact ? "text-heading leading-none" : "h-lg")}>{balance}</span>
            <span className="text-body-lg text-ash-gray">{t("credits.balance.unit")}</span>
          </p>
        )}
      </div>

      {q.isError && (
        <Alert tone="error" title={t("credits.loadError")} action={<Button variant="ghost" onClick={() => void q.refetch()}>{t("action.retry")}</Button>}>
          {messageFor(q.error, lang).message}
        </Alert>
      )}

      {q.isPending && (
        <div aria-busy="true" className="grid gap-[18px] sm:grid-cols-3">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      )}

      {q.data && packs.length === 0 && <Alert tone="info">{t("credits.packs.empty")}</Alert>}

      {pack && (
        <>
          <section aria-labelledby="packs-h">
            <h2 id="packs-h" className="sub mb-[13px]">{t("credits.packs")}</h2>
            <div className={cn("grid gap-[18px]", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
              {packs.map((p) => (
                <PackCard key={p.id} pack={p} selected={p.id === pack.id} onSelect={() => setSelected(p.id)} compact={compact} />
              ))}
            </div>
          </section>

          <Tabs
            label={t("credits.tab.label")}
            items={[
              { id: "card", label: t("credits.tab.card"), panel: <DodoCheckout pack={pack} /> },
              { id: "crypto", label: t("credits.tab.crypto"), panel: <CryptoInvoice pack={pack} /> },
            ]}
          />
        </>
      )}
    </div>
  );
}

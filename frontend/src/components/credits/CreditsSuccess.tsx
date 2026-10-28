"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Alert, Button, Skeleton } from "@/components/ui";
import { useCreditsQuery } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const POLL_MS = 3000;
const POLL_TIMES = 10;

/** /credits/success: a calm confirmation. The webhook may land a moment after the redirect, so refetch a few times. */
export function CreditsSuccess() {
  const { t } = useT();
  const mock = useSearchParams().get("mock") === "1";
  const q = useCreditsQuery();
  const { refetch } = q;

  useEffect(() => {
    if (mock) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      void refetch();
      if (n >= POLL_TIMES) window.clearInterval(id);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [mock, refetch]);

  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("credits.eyebrow")} title={t("credits.success.title")} intro={t("credits.success.body")} />
      <div className="grid max-w-[640px] gap-[26px]">
        {mock && <Alert tone="warning">{t("credits.success.mock")}</Alert>}
        <div aria-live="polite">
          <p className="text-body text-ash-gray">{t("credits.success.balance")}</p>
          {q.data ? (
            <p className="mt-[4px] flex items-baseline gap-[13px]">
              <span className="h-lg tabular-nums">{q.data.balance}</span>
              <span className="text-body-lg text-ash-gray">{t("credits.balance.unit")}</span>
            </p>
          ) : (
            <Skeleton className="mt-[7px] h-[53px] w-[120px]" />
          )}
        </div>
        {!mock && <p className="text-body text-ash-gray">{t("credits.success.waiting")}</p>}
        <div className="flex flex-wrap gap-[13px]">
          <Button variant="green" size="lg" href="/check">{t("credits.success.cta")}</Button>
          <Button variant="ghost" onClick={() => void refetch()}>{t("credits.success.refresh")}</Button>
        </div>
      </div>
    </div>
  );
}

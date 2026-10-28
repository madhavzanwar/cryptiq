"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";

export function CreditsCancelled() {
  const { t } = useT();
  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("credits.eyebrow")} title={t("credits.cancelled.title")} intro={t("credits.cancelled.body")} />
      <Button variant="green" size="lg" href="/credits">{t("credits.cancelled.back")}</Button>
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Tag } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";
import { UsageAndActivity } from "./ActivityTable";
import { CreditsContent } from "./CreditsContent";
import { CreditsFaq } from "./CreditsFaq";

export function CreditsPage() {
  const { t } = useT();
  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("credits.eyebrow")} title={t("credits.title")} intro={t("credits.intro")}>
        <div className="mt-[18px] flex flex-wrap gap-[9px]">
          <Tag tone="outline">{t("credits.badge.dodo")}</Tag>
          <Tag tone="outline">{t("credits.badge.cake")}</Tag>
        </div>
      </PageHeader>

      <div className="grid gap-[53px]">
        <CreditsContent />
        <UsageAndActivity />
        <CreditsFaq />
      </div>
    </div>
  );
}

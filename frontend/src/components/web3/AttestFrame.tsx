"use client";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { useT } from "@/lib/i18n/provider";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/** Shared chrome of the attestation panel: title, one-sentence explanation, permanence warning. */
export function AttestFrame({ simulated = false, children }: { simulated?: boolean; children: ReactNode }) {
  const { t } = useT();
  return (
    <Card className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-[11px]">
        <ShieldCheck className="size-6 flex-none" aria-hidden strokeWidth={1.75} />
        <h3 className="sub">{t("web3.panel.title")}</h3>
        {simulated && <Tag tone="yellow">{t("web3.badge.simulated")}</Tag>}
      </div>
      <p className="measure text-body-lg">{t("web3.panel.intro")}</p>
      <Alert tone="warning">
        <p>{t("web3.panel.warning")}</p>
        <p className="mt-1 font-semibold">{t("web3.panel.testnet")}</p>
      </Alert>
      {children}
    </Card>
  );
}

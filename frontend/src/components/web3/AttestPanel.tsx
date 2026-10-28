"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CheckResponse } from "@/lib/api/types";
import { canAttest } from "@/lib/eas/rules";
import { USE_MOCKS } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { Ban } from "lucide-react";
import dynamic from "next/dynamic";
import { SimulatedAttest } from "./SimulatedAttest";
import { WalletSlot } from "./WalletSlot";

// Wallet + signing code is a separate client-only chunk (never in server HTML, never in the first paint); it is
// rendered by the shared wallet host through a WalletSlot portal.
const AttestFlow = dynamic(() => import("./AttestFlow"), {
  ssr: false,
  loading: () => <AttestSkeleton />,
});

function AttestSkeleton() {
  return <Skeleton className="h-[360px] w-full rounded-card" />;
}

/**
 * "Keep proof on-chain": creates an EAS attestation on Base Sepolia (TEST network) for a check result.
 * Contract with the check page: `<AttestPanel result={checkResponse} historyId={optionalHistoryEntryId} />`.
 * - UNKNOWN / not_in_dataset results are never attested (there is no evidence to prove).
 * - Mock mode renders a clearly labelled simulated flow with no transaction and no link.
 */
export function AttestPanel({ result, historyId }: { result: CheckResponse; historyId?: string }) {
  const { t } = useT();
  if (result.status === "error") return null;
  if (!canAttest(result)) {
    return (
      <Card className="flex items-start gap-[13px]">
        <Ban className="mt-[3px] size-6 flex-none" aria-hidden strokeWidth={1.75} />
        <div>
          <h3 className="sub">{t("web3.unknown.title")}</h3>
          <p className="measure mt-[7px] text-ash-gray">{t("web3.unknown.body")}</p>
        </div>
      </Card>
    );
  }
  if (USE_MOCKS) return <SimulatedAttest result={result} />;
  return (
    <WalletSlot fallback={<AttestSkeleton />}>
      <AttestFlow result={result} historyId={historyId} />
    </WalletSlot>
  );
}

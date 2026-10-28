"use client";

import { Alert, Button, Segmented } from "@/components/ui";
import { messageFor } from "@/lib/api/errors";
import { api } from "@/lib/api/instance";
import type { CreditPack, CryptoCoin, InvoiceState } from "@/lib/api/types";
import { USE_MOCKS } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { secondsLeft } from "@/lib/pagesTime";
import { useCredits } from "@/lib/stores/credits";
import { toast } from "@/lib/stores/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { InvoiceCard } from "./InvoiceCard";

/** Ticks once a second and returns the seconds left until `expiresAt`. */
function useRemaining(expiresAt: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return expiresAt ? secondsLeft(expiresAt, now) : 0;
}

/**
 * "Pay privately with crypto (Cake Wallet)": POST /api/crypto-invoice, show QR + URI, poll the status every
 * 5 s. We do not embed Cake Wallet: it opens a standard bitcoin: / monero: link. On `paid` the credits are
 * added to the local balance and the credits query is refreshed.
 */
export function CryptoInvoice({ pack }: { pack: CreditPack }) {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const [coin, setCoin] = useState<CryptoCoin>("btc");

  const create = useMutation({ mutationFn: () => api.createInvoice(pack.id, coin) });
  const invoice = create.data;

  // a different pack or coin means a different invoice
  const { reset } = create;
  useEffect(() => {
    reset();
  }, [pack.id, coin, reset]);

  const statusQ = useQuery({
    queryKey: ["invoice", invoice?.invoiceId],
    enabled: invoice !== undefined,
    queryFn: ({ signal }) => api.invoiceStatus((invoice as NonNullable<typeof invoice>).invoiceId, { signal }),
    refetchInterval: (q) => (q.state.data?.status === "paid" || q.state.data?.status === "expired" ? false : 5000),
  });

  const remaining = useRemaining(invoice?.expiresAt);
  const apiStatus: InvoiceState = statusQ.data?.status ?? "waiting";
  const status: InvoiceState = apiStatus === "waiting" && invoice && remaining === 0 ? "expired" : apiStatus;

  // credit the balance exactly once per paid invoice
  const credited = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "paid" || !invoice || credited.current === invoice.invoiceId) return;
    credited.current = invoice.invoiceId;
    useCredits.getState().applyTopup(pack.credits, `${invoice.coin.toUpperCase()} · ${pack.label}`);
    void qc.invalidateQueries({ queryKey: ["credits"] });
    toast(t("credits.crypto.paid"), "success");
  }, [status, invoice, pack, qc, t]);

  const simulate = async () => {
    if (!invoice) return;
    const { simulatePayment } = await import("@/lib/mocks");
    simulatePayment(invoice.invoiceId);
    void statusQ.refetch();
  };

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center gap-[13px]">
        <Segmented<CryptoCoin>
          label={t("credits.coin.label")}
          value={coin}
          onChange={setCoin}
          options={[
            { value: "btc", label: t("credits.coin.btc") },
            { value: "xmr", label: t("credits.coin.xmr") },
          ]}
        />
        {!invoice && (
          <Button variant="black" onClick={() => create.mutate()} loading={create.isPending}>
            {t("credits.crypto.create")}
          </Button>
        )}
      </div>

      {create.isError && <Alert tone="error">{messageFor(create.error, lang).message}</Alert>}

      {invoice && (
        <InvoiceCard
          invoice={invoice}
          status={status}
          remaining={remaining}
          onNew={() => create.reset()}
          {...(USE_MOCKS ? { onSimulate: simulate } : {})}
        />
      )}
    </div>
  );
}

"use client";

import { Alert, Button } from "@/components/ui";
import { messageFor } from "@/lib/api/errors";
import { api } from "@/lib/api/instance";
import type { CreditPack } from "@/lib/api/types";
import { DODO_TEST_HINT } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { formatUsd } from "@/lib/pagesMoney";
import { useMutation } from "@tanstack/react-query";

/** "Pay with card (Dodo, test mode)": POST /api/checkout, then go to the checkout URL the backend returns. */
export function DodoCheckout({ pack }: { pack: CreditPack }) {
  const { t, lang } = useT();
  const checkout = useMutation({
    mutationFn: () => api.checkout(pack.id),
    onSuccess: ({ url }) => window.location.assign(url),
  });

  return (
    <div className="grid gap-[18px]">
      <p className="text-body-lg font-semibold">{t("credits.card.summary", { label: pack.label, n: pack.credits, price: formatUsd(pack.priceUsd) })}</p>
      <p className="measure text-body text-ash-gray">{t("credits.card.note")}</p>
      {DODO_TEST_HINT && <p className="text-small text-ash-gray">{t("credits.card.hint", { hint: DODO_TEST_HINT })}</p>}

      {checkout.isError && <Alert tone="error">{messageFor(checkout.error, lang).message}</Alert>}

      <div>
        {/* the one saturated green on this screen: the primary action */}
        <Button variant="green" size="lg" onClick={() => checkout.mutate()} loading={checkout.isPending || checkout.isSuccess}>
          {checkout.isSuccess ? t("credits.card.redirecting") : t("credits.card.continue")}
        </Button>
      </div>
    </div>
  );
}

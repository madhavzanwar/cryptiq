"use client";

import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";

/** Global error boundary UI: a friendly message, no stack traces. */
export function ErrorView({ reset }: { reset: () => void }) {
  const { t } = useT();
  return (
    <div className="container-page section-gap" role="alert">
      <h1 className="h-lg">{t("error.title")}</h1>
      <p className="measure mt-[26px] text-body-lg text-ash-gray">{t("error.body")}</p>
      <div className="mt-[35px] flex flex-wrap gap-[13px]">
        <Button variant="green" size="lg" onClick={reset}>{t("action.retry")}</Button>
        <Button variant="ghost" size="lg" href="/">{t("error.home")}</Button>
      </div>
    </div>
  );
}

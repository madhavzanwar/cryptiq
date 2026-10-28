"use client";

import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";

export function NotFoundView() {
  const { t } = useT();
  return (
    <div className="container-page section-gap">
      <p className="eyebrow">404</p>
      <h1 className="display mt-[13px]">{t("notFound.title")}</h1>
      <p className="measure mt-[35px] text-body-lg text-ash-gray">{t("notFound.body")}</p>
      <div className="mt-[35px] flex flex-wrap gap-[13px]">
        <Button variant="green" size="lg" href="/">{t("notFound.home")}</Button>
        <Button variant="ghost" size="lg" href="/check">{t("notFound.check")}</Button>
      </div>
    </div>
  );
}

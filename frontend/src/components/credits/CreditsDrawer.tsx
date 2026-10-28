"use client";

import { Drawer } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";
import { useUi } from "@/lib/stores/ui";
import Link from "next/link";
import { CreditsContent } from "./CreditsContent";

/** The credits drawer: opened by the top-bar credit pill and by 402 `no_credits` errors (useUi.creditsOpen). */
export function CreditsDrawer() {
  const { t } = useT();
  const open = useUi((s) => s.creditsOpen);
  const close = useUi((s) => s.closeCredits);
  return (
    <Drawer open={open} onClose={close} title={t("credits.drawer.title")}>
      <CreditsContent compact />
      <Link href="/credits" onClick={close} className="mt-[26px] inline-flex min-h-11 items-center text-body-lg underline underline-offset-4">
        {t("credits.drawer.more")}
      </Link>
    </Drawer>
  );
}

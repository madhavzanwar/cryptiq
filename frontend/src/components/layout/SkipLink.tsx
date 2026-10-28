"use client";

import { useT } from "@/lib/i18n/provider";

/** First focusable element: jumps keyboard users past the navigation to the page content. */
export function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-[9px] focus:left-[9px] focus:z-[70] focus:rounded-button focus:bg-carbon focus:px-[18px] focus:py-[13px] focus:text-pure-white"
    >
      {t("skip.content")}
    </a>
  );
}

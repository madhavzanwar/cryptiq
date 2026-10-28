"use client";

import { USE_MOCKS } from "@/lib/env";
import { useHealth } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";

/** Bottom-left label: "MOCK DATA" with the built-in mocks, "SYNTHETIC DATA" when the backend runs on its fixture. */
export function MockRibbon() {
  const { t } = useT();
  const health = useHealth();
  const label = USE_MOCKS ? t("mock.ribbon") : health.data?.mocks ? t("mock.synthetic") : null;
  if (!label) return null;
  return (
    <div role="status" className="fixed bottom-0 left-0 z-20 flex h-[26px] items-center rounded-tr-tag border border-b-0 border-l-0 border-carbon bg-cotton-pink px-[13px] text-small font-semibold">
      {label}
    </div>
  );
}

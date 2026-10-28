"use client";

import { Segmented } from "@/components/ui/Segmented";
import type { Lang } from "@/lib/api";
import { useT } from "@/lib/i18n/provider";
import { useSettings } from "@/lib/stores/settings";

/** EN | हिं: switches the interface language everywhere (persisted in Settings). */
export function LangToggle() {
  const { t, lang } = useT();
  const setLang = useSettings((s) => s.setLang);
  return (
    <Segmented<Lang>
      label={t("lang.label")}
      value={lang}
      onChange={setLang}
      options={[
        { value: "en", label: t("lang.en"), ariaLabel: "English", lang: "en" },
        { value: "hi", label: t("lang.hi"), ariaLabel: "हिन्दी", lang: "hi" },
      ]}
      className="[&_label]:px-[11px] sm:[&_label]:px-[18px]"
    />
  );
}

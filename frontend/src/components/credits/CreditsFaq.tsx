"use client";

import { AccordionItem } from "@/components/ui";
import { useT } from "@/lib/i18n/provider";

export function CreditsFaq() {
  const { t } = useT();
  return (
    <section aria-labelledby="faq-h">
      <h2 id="faq-h" className="sub mb-[13px]">{t("credits.faq.title")}</h2>
      <div className="max-w-[800px]">
        <AccordionItem question={t("credits.faq.q1")}>{t("credits.faq.a1")}</AccordionItem>
        <AccordionItem question={t("credits.faq.q2")}>{t("credits.faq.a2")}</AccordionItem>
        <AccordionItem question={t("credits.faq.q3")}>{t("credits.faq.a3")}</AccordionItem>
        <AccordionItem question={t("credits.faq.q4")}>{t("credits.faq.a4")}</AccordionItem>
      </div>
    </section>
  );
}

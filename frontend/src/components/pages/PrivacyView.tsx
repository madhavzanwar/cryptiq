"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { Cookie, Database, EyeOff, KeyRound, Link2, ShieldAlert } from "lucide-react";

const ITEMS: { icon: typeof EyeOff; title: MessageKey; body: MessageKey }[] = [
  { icon: EyeOff, title: "privacy.public.title", body: "privacy.public.body" },
  { icon: KeyRound, title: "privacy.seed.title", body: "privacy.seed.body" },
  { icon: Database, title: "privacy.store.title", body: "privacy.store.body" },
  { icon: Cookie, title: "privacy.cookie.title", body: "privacy.cookie.body" },
  { icon: Link2, title: "privacy.chain.title", body: "privacy.chain.body" },
  { icon: ShieldAlert, title: "privacy.limits.title", body: "privacy.limits.body" },
];

export function PrivacyView() {
  const { t } = useT();
  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("privacy.eyebrow")} title={t("privacy.title")} intro={t("privacy.intro")} />
      <ul className="grid max-w-[800px] gap-[26px]">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-[18px] rounded-card border border-carbon bg-pure-white p-[var(--card-padding)]">
            <Icon className="mt-[3px] size-8 flex-none" aria-hidden strokeWidth={1.5} />
            <div>
              <h2 className="sub">{t(title)}</h2>
              <p className="measure mt-[7px] text-body-lg text-ash-gray">{t(body)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

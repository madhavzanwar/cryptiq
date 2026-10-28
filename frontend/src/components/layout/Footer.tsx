"use client";

import { GITHUB_URL } from "@/lib/env";
import { useHealth } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import Link from "next/link";

const THANKS = ["AI Grants India", "Socket Security", "Edge City"];

/** Footer: pitch, links, the permanent honesty line, "Built with" (only what is really used) and "Thanks". */
export function Footer() {
  const { t } = useT();
  const health = useHealth();
  const built = [t("layout.footer.tg"), t("layout.footer.dodo"), t("layout.footer.cake"), t("layout.footer.eas")];
  if (health.data?.voiceProvider === "wispr") built.push(t("layout.footer.wispr"));
  const link = "inline-flex min-h-11 items-center underline-offset-4 hover:underline";
  return (
    <footer className="border-t border-carbon bg-pure-white py-[70px]">
      <div className="container-page grid gap-[35px] md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="measure text-body-lg">{t("layout.footer.pitch")}</p>
          <nav aria-label={t("layout.footer.links")} className="mt-[18px] flex flex-wrap gap-x-[26px] text-body">
            <Link className={link} href="/about">{t("nav.about")}</Link>
            <Link className={link} href="/credits">{t("nav.credits")}</Link>
            <Link className={link} href="/privacy">{t("layout.footer.privacy")}</Link>
            <a className={link} href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{t("layout.github")}</a>
            <Link className={link} href="/about#credits">{t("layout.footer.credits")}</Link>
          </nav>
        </div>
        <div className="md:col-span-4">
          <h2 className="text-body-lg">{t("layout.footer.builtWith")}</h2>
          <ul className="mt-[9px] grid gap-1 text-small text-ash-gray">
            {built.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="text-body-lg">{t("layout.footer.thanks")}</h2>
          <ul className="mt-[9px] grid gap-1 text-small text-ash-gray">
            {THANKS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <p className="border-t border-carbon pt-[26px] text-small text-ash-gray md:col-span-12">{t("honesty.short")}</p>
      </div>
    </footer>
  );
}

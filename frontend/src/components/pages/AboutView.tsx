"use client";

import { PageHeader, Section } from "@/components/pages/PageHeader";
import { Tag } from "@/components/ui";
import { useHealth } from "@/lib/hooks/useApi";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { CREDIT_AREAS, CREDIT_ROWS, TEAM, type CreditArea } from "@/lib/pagesCredits";
import { Gauge, FileText, MessageSquareText, Mic, Monitor, Network, ServerCog, ShieldCheck } from "lucide-react";
import Link from "next/link";

const PIPE: { icon: typeof Mic; title: MessageKey; body: MessageKey }[] = [
  { icon: Mic, title: "about.pipe.voice", body: "about.pipe.voice.d" },
  { icon: ServerCog, title: "about.pipe.api", body: "about.pipe.api.d" },
  { icon: Network, title: "about.pipe.graph", body: "about.pipe.graph.d" },
  { icon: Gauge, title: "about.pipe.model", body: "about.pipe.model.d" },
  { icon: FileText, title: "about.pipe.evidence", body: "about.pipe.evidence.d" },
  { icon: MessageSquareText, title: "about.pipe.llm", body: "about.pipe.llm.d" },
  { icon: Monitor, title: "about.pipe.ui", body: "about.pipe.ui.d" },
  { icon: ShieldCheck, title: "about.pipe.eas", body: "about.pipe.eas.d" },
];

const STATS: { value: string; label: MessageKey }[] = [
  { value: "822,942", label: "about.data.s1" },
  { value: "14,266", label: "about.data.s2" },
  { value: "251,088", label: "about.data.s3" },
  { value: "557,588", label: "about.data.s4" },
  { value: "2,868,964", label: "about.data.s5" },
];

const AREA_LABEL: Record<CreditArea, MessageKey> = {
  data: "about.credits.area.data",
  backend: "about.credits.area.backend",
  frontend: "about.credits.area.frontend",
  reference: "about.credits.area.reference",
};

const TOC: { id: string; label: MessageKey }[] = [
  { id: "problem", label: "about.problem.title" },
  { id: "how-it-works", label: "about.how.title" },
  { id: "data", label: "about.data.title" },
  { id: "sponsors", label: "about.sponsors.title" },
  { id: "privacy", label: "about.privacy.title" },
  { id: "limits", label: "about.limits.title" },
  { id: "credits", label: "about.credits.title" },
  { id: "team", label: "about.team.title" },
];

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export function AboutView() {
  const { t } = useT();
  const health = useHealth();
  const wisprActive = health.data?.voiceProvider === "wispr";

  const sponsors: { name: MessageKey; body: MessageKey }[] = [
    { name: "about.sponsors.tigergraph.name", body: "about.sponsors.tigergraph.body" },
    { name: "about.sponsors.wispr.name", body: "about.sponsors.wispr.body" },
    { name: "about.sponsors.dodo.name", body: "about.sponsors.dodo.body" },
    { name: "about.sponsors.cake.name", body: "about.sponsors.cake.body" },
    { name: "about.sponsors.base.name", body: "about.sponsors.base.body" },
  ];

  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("about.eyebrow")} title={t("about.title")} intro={t("about.intro")}>
        <nav aria-label={t("about.toc")} className="mt-[26px] flex flex-wrap gap-[9px]">
          {TOC.map((x) => (
            <a key={x.id} href={`#${x.id}`} className="inline-flex min-h-11 items-center rounded-tag bg-bone px-[13px] text-small transition-colors duration-[120ms] ease-out hover:bg-plaster">
              {t(x.label)}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="max-w-[1000px]">
        <Section id="problem" title={t("about.problem.title")}>
          <div className="grid gap-[13px]">
            <p className="measure text-body-lg">{t("about.problem.p1")}</p>
            <p className="measure text-body-lg text-ash-gray">{t("about.problem.p2")}</p>
            <p className="measure text-body-lg text-ash-gray">{t("about.problem.p3")}</p>
          </div>
        </Section>

        <Section id="how-it-works" title={t("about.how.title")}>
          <p className="measure mb-[26px] text-body-lg text-ash-gray">{t("about.how.intro")}</p>
          <ol className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {PIPE.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex flex-col gap-[9px] rounded-card border border-carbon bg-pure-white p-[18px]">
                <div className="flex items-center justify-between">
                  <Icon className="size-8" aria-hidden strokeWidth={1.5} />
                  <Tag tone="bone">{i + 1}</Tag>
                </div>
                <h3 className="text-body-lg font-semibold">{t(title)}</h3>
                <p className="text-body text-ash-gray">{t(body)}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="data" title={t("about.data.title")}>
          <div className="grid gap-[13px]">
            <p className="measure text-body-lg">{t("about.data.p1")}</p>
            <p className="measure text-body-lg text-ash-gray">{t("about.data.p2")}</p>
          </div>
          <dl className="mt-[26px] grid grid-cols-2 gap-[13px] sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-card bg-bone p-[18px]">
                <dd className="text-subheading font-semibold tabular-nums">{s.value}</dd>
                <dt className="text-small text-ash-gray">{t(s.label)}</dt>
              </div>
            ))}
          </dl>
          <p className="measure mt-[26px] text-body text-ash-gray">
            <strong className="text-carbon">{t("about.data.cite")}: </strong>
            {t("about.data.citeText")}{" "}
            <a className="underline underline-offset-4" href="https://github.com/git-disl/EllipticPlusPlus" {...ext}>{t("about.data.repo")}</a>
          </p>
        </Section>

        <Section id="sponsors" title={t("about.sponsors.title")}>
          <p className="measure mb-[18px] text-body-lg text-ash-gray">{t("about.sponsors.intro")}</p>
          <ul className="grid gap-[13px]">
            {sponsors.map((s) => (
              <li key={s.name} className="rounded-card border border-carbon bg-pure-white p-[18px]">
                <h3 className="text-body-lg font-semibold">{t(s.name)}</h3>
                <p className="measure mt-[4px] text-body text-ash-gray">{t(s.body)}</p>
                {s.name === "about.sponsors.wispr.name" && wisprActive && <Tag tone="allow" className="mt-[9px]">{t("about.sponsors.wispr.active")}</Tag>}
              </li>
            ))}
          </ul>
          <p className="mt-[18px] text-body">
            <strong>{t("about.thanks.title")}: </strong>
            <span className="text-ash-gray">{t("about.thanks.body")}</span>
          </p>
        </Section>

        <Section id="privacy" title={t("about.privacy.title")}>
          <p className="measure text-body-lg text-ash-gray">{t("about.privacy.body")}</p>
          <Link href="/privacy" className="mt-[13px] inline-flex min-h-11 items-center underline underline-offset-4">{t("about.privacy.more")}</Link>
        </Section>

        <Section id="limits" title={t("about.limits.title")}>
          <ul className="grid list-disc gap-[9px] pl-[26px] text-body-lg marker:text-carbon">
            {(["l1", "l2", "l3", "l4", "l5"] as const).map((k) => (
              <li key={k} className="measure">{t(`about.limits.${k}` as MessageKey)}</li>
            ))}
          </ul>
        </Section>

        <Section id="credits" title={t("about.credits.title")}>
          <p className="measure mb-[18px] text-body-lg text-ash-gray">{t("about.credits.intro")}</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-[26px]">
            {CREDIT_AREAS.map((area) => (
              <div key={area}>
                <h3 className="mb-[9px] text-body-lg font-semibold">{t(AREA_LABEL[area])}</h3>
                <div className="overflow-x-auto rounded-card border border-carbon bg-pure-white">
                  <table className="w-full border-collapse text-body">
                    <caption className="sr-only">{t(AREA_LABEL[area])}</caption>
                    <thead>
                      <tr className="bg-bone text-left text-small text-ash-gray">
                        <th scope="col" className="px-[18px] py-[11px] font-medium">{t("about.credits.col.component")}</th>
                        <th scope="col" className="px-[18px] py-[11px] font-medium">{t("about.credits.col.licence")}</th>
                        <th scope="col" className="px-[18px] py-[11px] font-medium">{t("about.credits.col.used")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CREDIT_ROWS.filter((r) => r.area === area).map((r) => (
                        <tr key={r.component} className="border-t border-bone align-top">
                          <th scope="row" className="min-w-[220px] p-[18px] text-left font-medium">
                            <a className="underline underline-offset-4" href={r.link} {...ext}>{r.component}</a>
                          </th>
                          <td className="min-w-[160px] p-[18px] text-ash-gray">{r.licence}</td>
                          <td className="min-w-[200px] p-[18px] text-ash-gray">{r.usedFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="team" title={t("about.team.title")}>
          <p className="mb-[13px] text-body text-ash-gray">{t("about.team.body")}</p>
          <ul className="grid gap-[13px] sm:grid-cols-2">
            {TEAM.map((m) => (
              <li key={m.name} className="rounded-card bg-bone p-[18px]">
                <p className="text-body-lg font-semibold">{m.name}</p>
                <p className="text-body text-ash-gray">{m.role}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

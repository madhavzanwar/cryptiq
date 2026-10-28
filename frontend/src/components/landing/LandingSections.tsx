"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { useReveal } from "@/lib/motion/useReveal";
import { Check, Coins, Fingerprint, Mic, Network, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { useRef, type CSSProperties, type ReactNode } from "react";

const delay = (ms: number): CSSProperties => ({ "--d": `${ms}ms` }) as CSSProperties;

function Heading({ eyebrow, title, id }: { eyebrow: MessageKey; title: MessageKey; id: string }) {
  const { t } = useT();
  return (
    <div data-reveal>
      <p className="eyebrow">{t(eyebrow)}</p>
      <h2 id={id} className="h-md mt-[18px] max-w-[18ch]">
        {t(title)}
      </h2>
    </div>
  );
}

function Section({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <section aria-labelledby={labelledBy} className="container-page section-gap">
      {children}
    </section>
  );
}

/** The ordinary landing sections that follow the scroll story (P1): problem, how it works, difference, tech, limits, CTA. */
export function LandingSections() {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  const problems = [
    { tint: "yellow", title: "land.problem.c1.title", text: "land.problem.c1.text", icon: <Zap className="size-8" aria-hidden strokeWidth={1.5} /> },
    { tint: "pink", title: "land.problem.c2.title", text: "land.problem.c2.text", icon: <Fingerprint className="size-8" aria-hidden strokeWidth={1.5} /> },
    { tint: "blue", title: "land.problem.c3.title", text: "land.problem.c3.text", icon: <ShieldAlert className="size-8" aria-hidden strokeWidth={1.5} /> },
  ] as const;
  const steps = [
    { n: 1, title: "land.how.s1.title", text: "land.how.s1.text", icon: <Mic className="size-6" aria-hidden strokeWidth={1.75} /> },
    { n: 2, title: "land.how.s2.title", text: "land.how.s2.text", icon: <Network className="size-6" aria-hidden strokeWidth={1.75} /> },
    { n: 3, title: "land.how.s3.title", text: "land.how.s3.text", icon: <ShieldCheck className="size-6" aria-hidden strokeWidth={1.75} /> },
    { n: 4, title: "land.how.s4.title", text: "land.how.s4.text", icon: <Fingerprint className="size-6" aria-hidden strokeWidth={1.75} /> },
  ] as const;
  const diffs = [
    ["land.diff.d1.title", "land.diff.d1.text"],
    ["land.diff.d2.title", "land.diff.d2.text"],
    ["land.diff.d3.title", "land.diff.d3.text"],
    ["land.diff.d4.title", "land.diff.d4.text"],
  ] as const;
  const tech = [
    ["layout.footer.tg", "land.tech.tg"],
    ["layout.footer.dodo", "land.tech.dodo"],
    ["layout.footer.cake", "land.tech.cake"],
    ["layout.footer.eas", "land.tech.eas"],
  ] as const;
  const limits = ["land.limits.l1", "land.limits.l2", "land.limits.l3", "land.limits.l4"] as const;

  return (
    <div ref={root} className="bg-paper-white">
      <Section labelledBy="problem-title">
        <Heading eyebrow="land.problem.eyebrow" title="land.problem.title" id="problem-title" />
        <div className="mt-[42px] grid items-start gap-[26px] md:grid-cols-3">
          {problems.map((p, i) => (
            <div key={p.title} data-reveal style={delay(i * 120)} className={i === 1 ? "md:mt-[42px]" : i === 2 ? "md:mt-[18px]" : ""}>
              <Card tint={p.tint} className="flex min-h-[231px] flex-col justify-between gap-[26px]">
                {p.icon}
                <div>
                  <h3 className="sub">{t(p.title)}</h3>
                  <p className="mt-[9px] text-body-lg">{t(p.text)}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="how-title">
        <Heading eyebrow="land.how.eyebrow" title="land.how.title" id="how-title" />
        <ol className="mt-[42px] grid gap-[26px] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n} data-reveal style={delay(i * 100)}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-tag bg-carbon text-body text-pure-white" aria-hidden>
                    {s.n}
                  </span>
                  {s.icon}
                </div>
                <h3 className="sub mt-[26px]">{t(s.title)}</h3>
                <p className="mt-[9px] text-ash-gray">{t(s.text)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="diff-title">
        <Heading eyebrow="land.diff.eyebrow" title="land.diff.title" id="diff-title" />
        <div data-reveal className="mt-[42px]">
          <Card tint="bone" className="grid gap-[26px] sm:grid-cols-2 lg:grid-cols-4">
            {diffs.map(([title, text]) => (
              <div key={title}>
                <Check className="size-6" aria-hidden strokeWidth={2} />
                <h3 className="sub mt-[13px]">{t(title)}</h3>
                <p className="mt-[9px] text-ash-gray">{t(text)}</p>
              </div>
            ))}
          </Card>
        </div>
      </Section>

      <Section labelledBy="tech-title">
        <Heading eyebrow="land.tech.eyebrow" title="land.tech.title" id="tech-title" />
        <ul className="mt-[42px] grid gap-[26px] sm:grid-cols-2 lg:grid-cols-4">
          {tech.map(([name, text], i) => (
            <li key={name} data-reveal style={delay(i * 100)}>
              <Card className="h-full" title={t(text)}>
                <div className="flex items-center gap-[9px]">
                  {name === "layout.footer.dodo" ? <Coins className="size-5" aria-hidden strokeWidth={1.75} /> : <Network className="size-5" aria-hidden strokeWidth={1.75} />}
                  <h3 className="sub">{t(name)}</h3>
                </div>
                <p className="mt-[9px] text-ash-gray">{t(text)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="limits-title">
        <div data-reveal>
          <Card>
            <div className="flex items-center gap-[13px]">
              <ShieldAlert className="size-8" aria-hidden strokeWidth={1.5} />
              <h2 id="limits-title" className="h-sm">
                {t("land.limits.title")}
              </h2>
            </div>
            <ul className="measure mt-[26px] grid gap-[13px] text-body-lg">
              {limits.map((k) => (
                <li key={k} className="flex gap-[13px]">
                  <span aria-hidden className="mt-[10px] size-[7px] flex-none rounded-full bg-carbon" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <section aria-labelledby="cta-title" className="container-page pt-[26px] pb-[105px] text-center">
        <div data-reveal>
          <h2 id="cta-title" className="h-md mx-auto max-w-[16ch]">
            {t("land.cta.title")}
          </h2>
          <p className="mx-auto mt-[18px] max-w-[40ch] text-body-lg text-ash-gray">{t("land.cta.text")}</p>
          <div className="mt-[35px] flex flex-wrap items-center justify-center gap-[18px]">
            <Button href="/check" variant="green" size="lg">
              {t("land.cta.button")}
            </Button>
            <Button href="/about#limits" variant="ghost" size="lg">
              {t("land.cta.limits")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

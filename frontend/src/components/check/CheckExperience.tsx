"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EvidenceGraph } from "@/components/graph/EvidenceGraph";
import { AttestPanel } from "@/components/web3/AttestPanel";
import { useCheckController, type CheckController } from "@/lib/hooks/checkController";
import { useT } from "@/lib/i18n/provider";
import { VERDICT_META } from "@/lib/verdict";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { DetailsTabs } from "./DetailsTabs";
import { ExplanationPanel } from "./ExplanationPanel";
import { InputCard } from "./InputCard";
import { ProgressSteps } from "./ProgressSteps";
import { VerdictCard } from "./VerdictCard";

/** Skeletons for the verdict and graph while a check runs. */
function CheckingSkeletons() {
  return (
    <div aria-hidden className="grid gap-[18px]">
      <Skeleton className="h-[26px] w-[44%]" />
      <Skeleton className="h-[64px] w-[62%] rounded-card" />
      <Skeleton className="h-[13px] w-full" />
      <Skeleton className="h-[31px] w-[80%]" />
    </div>
  );
}

function ErrorAlert({ c }: { c: CheckController }) {
  const { t } = useT();
  const s = c.flow.state;
  if (s.phase !== "error") return null;
  const retryable = s.action === "retry-later" || s.action === "check-connection" || s.code === "timeout" || s.action === "none";
  return (
    <Alert
      tone="error"
      title={t("check.error.title")}
      action={
        s.action === "open-credits" ? (
          <Button variant="black" onClick={() => c.submit()}>{t("action.openCredits")}</Button>
        ) : retryable && s.action !== "seed-phrase-warning" ? (
          <Button variant="black" onClick={c.retry}>{t("action.retry")}</Button>
        ) : undefined
      }
    >
      {s.action === "seed-phrase-warning" ? t("check.secret.body") : s.message}
    </Alert>
  );
}

/**
 * /check: left column = input + progress/error + verdict; right column = graph, explanation, attest, details.
 * On phones the DOM order gives Input -> Verdict -> Graph -> Explanation -> Attest -> Details.
 */
export function CheckExperience() {
  const { t, lang } = useT();
  const c = useCheckController();
  const reduce = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);
  const st = c.flow.state;
  const result = st.phase === "done" ? st.result : null;

  // On small screens bring the verdict into view when it arrives.
  useEffect(() => {
    if (st.phase === "done" && window.innerWidth < 1024) resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [st.phase, reduce]);

  return (
    <div className="container-page section-gap">
      <header className="mb-[42px]">
        <p className="eyebrow">{t("check.page.sub")}</p>
        <h1 className="h-md mt-[9px]">{t("check.page.title")}</h1>
      </header>

      <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-12">
        <div className="flex flex-col gap-[var(--grid-gap)] lg:col-span-5">
          <InputCard c={c} />

          {st.phase === "checking" && (
            <Card aria-live="polite" className="flex flex-col gap-[18px]">
              <div className="flex items-center justify-between gap-[13px]">
                <h2 className="sub">{t("check.progress.title")}</h2>
                <Button variant="ghost" onClick={c.flow.cancel}>{t("check.progress.cancel")}</Button>
              </div>
              <ProgressSteps steps={st.steps} />
              <CheckingSkeletons />
            </Card>
          )}

          <ErrorAlert c={c} />

          <div ref={resultRef} className="scroll-mt-[90px]">
            {result && (
              <>
                <p className="sr-only" role="status">
                  {result.riskScore === null
                    ? t("check.result.announce.na", { verdict: t(VERDICT_META[result.verdict].word) })
                    : t("check.result.announce", { verdict: t(VERDICT_META[result.verdict].word), score: result.riskScore })}
                </p>
                <VerdictCard result={result} />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-[var(--grid-gap)] lg:col-span-7">
          {st.phase === "checking" && <Skeleton className="h-[420px] rounded-card" />}
          {result && (
            <>
              <EvidenceGraph result={result} />
              <ExplanationPanel result={result} requestLang={st.phase === "done" ? st.lang : lang} />
              <div id="attest-region" tabIndex={-1} className="scroll-mt-[90px] outline-none empty:hidden">
                {result.status === "ok" ? (
                  <AttestPanel result={result} historyId={st.phase === "done" ? st.entryId : undefined} />
                ) : (
                  <Card>
                    <h2 className="sub">{t("check.attest.unknown.title")}</h2>
                    <p className="mt-[9px] text-ash-gray">{t("check.attest.unknown.body")}</p>
                  </Card>
                )}
              </div>
              <DetailsTabs result={result} />
            </>
          )}
          {st.phase === "idle" && (
            <Card className="hidden min-h-[320px] items-center justify-center text-center text-ash-gray lg:flex">
              <p className="measure">{t("check.placeholder.graph")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

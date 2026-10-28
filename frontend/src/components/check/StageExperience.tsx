"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EvidenceGraph } from "@/components/graph/EvidenceGraph";
import { AttestPanel } from "@/components/web3/AttestPanel";
import { cn } from "@/lib/cn";
import type { CheckResponse, Verdict } from "@/lib/api/types";
import { useCheckController } from "@/lib/hooks/checkController";
import { useDemoWallets } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { FIXTURES } from "@/lib/mocks";
import { VERDICT_META } from "@/lib/verdict";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddressInput } from "./AddressInput";
import { ConfirmTranscript } from "./ConfirmTranscript";
import { DetailsTabs } from "./DetailsTabs";
import { ExplanationPanel } from "./ExplanationPanel";
import { MicButton } from "./MicButton";
import { pickDemoWallets } from "./DemoChips";
import { ProgressSteps } from "./ProgressSteps";
import { VerdictCard } from "./VerdictCard";
import { VoiceProviderChip } from "./VoiceProviderChip";

const SCRIPT = [
  { key: "check.stage.script.s1", s: 25 },
  { key: "check.stage.script.s2", s: 50 },
  { key: "check.stage.script.s3", s: 30 },
  { key: "check.stage.script.s4", s: 30 },
  { key: "check.stage.script.s5", s: 30 },
  { key: "check.stage.script.s6", s: 15 },
] as const;

/** Saved responses for "Cached replay" (the built-in mock fixtures). They carry `replay: true` and a neutral engine. */
const REPLAY_BY_VERDICT: Record<Verdict, string> = {
  BLOCK: "DEMO-ILLICIT-01",
  WARN: "DEMO-BORDERLINE-03",
  ALLOW: "DEMO-LICIT-02",
  UNKNOWN: "DEMO-NOTFOUND-04",
};
export function replayFor(expected: Verdict): CheckResponse {
  const base = FIXTURES[REPLAY_BY_VERDICT[expected]] as CheckResponse;
  return { ...base, replay: true, engine: "replay", cached: false, creditsRemaining: undefined };
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Index of the script segment that `seconds` falls in. */
export function scriptIndexAt(seconds: number): number {
  let acc = 0;
  for (let i = 0; i < SCRIPT.length; i++) {
    acc += SCRIPT[i]!.s;
    if (seconds < acc) return i;
  }
  return SCRIPT.length - 1;
}

/** /demo: distraction-free, large-type version of the check for the live demo. */
export function StageExperience() {
  const { t, lang } = useT();
  const c = useCheckController();
  const router = useRouter();
  const wallets = pickDemoWallets(useDemoWallets().data?.wallets ?? [], 4);
  const [replay, setReplay] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const attestRef = useRef<HTMLDivElement>(null);
  const st = c.flow.state;
  const result = st.phase === "done" ? st.result : null;

  const pick = (i: number) => {
    const w = wallets[i];
    if (!w) return;
    if (replay) {
      c.setValue(w.address);
      c.flow.show(replayFor(w.expected), lang, { replay: true });
    } else {
      c.setValue(w.address);
      c.runAddress(w.address);
    }
  };

  // Stage shortcuts: 1-4 wallets, A attest, B benchmark, S script (Space = talk is the mic's own handler).
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
      if (e.key >= "1" && e.key <= "4") pickRef.current(Number(e.key) - 1);
      else if (e.key === "a" || e.key === "A") {
        attestRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        attestRef.current?.focus({ preventScroll: true });
      } else if (e.key === "b" || e.key === "B") router.push("/benchmark");
      else if (e.key === "s" || e.key === "S") setShowScript((s) => !s);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  // Script stopwatch.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const replaying = replay || (st.phase === "done" && st.replay === true);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-[var(--page-gutter)] py-[26px]">
      <div className="mb-[26px] flex flex-wrap items-center justify-between gap-[13px]">
        <Button variant="ghost" href="/">
          <ArrowLeft className="size-4" aria-hidden />
          {t("check.stage.exit")}
        </Button>
        <div className="flex flex-wrap items-center gap-[18px]">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-[9px] text-body" title={t("check.stage.replayNote")}>
            <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} className="size-5 accent-carbon" />
            {t("check.stage.replaySwitch")}
          </label>
          <Button variant="ghost" aria-pressed={showScript} onClick={() => setShowScript((s) => !s)}>
            <ScrollText className="size-4" aria-hidden />
            {t("check.stage.script")}
          </Button>
        </div>
      </div>

      {replaying && (
        <span className="fixed top-0 right-0 z-40 rounded-bl-tag border border-t-0 border-r-0 border-carbon bg-cotton-pink px-[18px] py-[7px] text-body font-semibold" role="status">
          {t("check.stage.replay")}
        </span>
      )}

      {!result && (
        <section aria-label={t("check.page.title")} className="flex flex-col items-center gap-[26px] py-[26px]">
          <MicButton voice={c.voice} size="xl" disabled={c.checking || c.transcript !== null} />
          <VoiceProviderChip lastProvider={c.voice.provider} usingBrowser={c.voice.usingBrowser} />

          {c.secretWarning && (
            <p role="alert" className="measure rounded-card bg-block-tint px-[26px] py-[18px] text-body-lg text-block-ink">
              <strong>{t("check.secret.title")}</strong> {t("check.secret.body")}
            </p>
          )}
          {c.transcript && (
            <div className="w-full max-w-[640px]">
              <ConfirmTranscript key={c.transcript.text} transcript={c.transcript} allowDemo={c.allowDemo} busy={c.checking} onConfirm={c.confirmTranscript} onDismiss={c.dismissTranscript} onSecret={c.onSecret} />
            </div>
          )}

          {st.phase === "checking" && (
            <Card className="w-full max-w-[560px]">
              <ProgressSteps steps={st.steps} />
            </Card>
          )}
          {st.phase === "error" && (
            <p role="alert" className="measure rounded-card bg-block-tint px-[26px] py-[18px] text-body-lg text-block-ink">
              {st.message}
            </p>
          )}

          <div className="w-full max-w-[640px]">
            <AddressInput value={c.value} onChange={c.setValue} onSecret={c.onSecret} allowDemo={c.allowDemo} inputRef={c.inputRef} disabled={c.checking} size="lg" quiet />
          </div>
        </section>
      )}

      <section aria-label={t("check.stage.pick")} className="mt-[13px] grid grid-cols-2 gap-[13px] lg:grid-cols-4">
        {wallets.map((w, i) => (
          <button
            key={w.address}
            type="button"
            onClick={() => pick(i)}
            title={w.address}
            className={cn("flex min-h-[88px] flex-col items-start gap-[7px] rounded-card border border-carbon p-[18px] text-left transition-[background-color,transform] duration-[120ms] ease-out hover:bg-bone active:scale-[0.98]", VERDICT_META[w.expected].chip)}
          >
            <span className="flex w-full items-center justify-between text-small">
              <span className="rounded-tag border border-current px-[9px] py-[2px]">{i + 1}</span>
              <span className="font-semibold">{t(VERDICT_META[w.expected].word)}</span>
            </span>
            <span className="text-body-lg">{w.note}</span>
          </button>
        ))}
      </section>
      <p className="mt-[13px] text-small text-ash-gray">{t("check.stage.keys")}</p>

      {result && (
        <div className="mt-[42px] grid items-start gap-[var(--grid-gap)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <VerdictCard result={result} size="lg" />
          </div>
          <div className="flex flex-col gap-[var(--grid-gap)] lg:col-span-7">
            <EvidenceGraph result={result} />
          </div>
          <div className="lg:col-span-7">
            <ExplanationPanel result={result} requestLang={st.phase === "done" ? st.lang : lang} />
          </div>
          <div className="flex flex-col gap-[var(--grid-gap)] lg:col-span-5">
            <div ref={attestRef} id="attest-region" tabIndex={-1} className="outline-none empty:hidden">
              {result.status === "ok" && <AttestPanel result={result} historyId={st.phase === "done" ? st.entryId : undefined} />}
            </div>
            <DetailsTabs result={result} />
          </div>
        </div>
      )}

      {showScript && (
        <Card className="fixed bottom-[18px] left-[18px] z-40 max-h-[70dvh] w-[min(440px,calc(100vw-36px))] overflow-y-auto" role="complementary" aria-label={t("check.stage.script.title")}>
          <div className="mb-[13px] flex items-center justify-between gap-[13px]">
            <h2 className="sub">{t("check.stage.script.title")}</h2>
            <Button
              variant="ghost"
              onClick={() => {
                if (running) setRunning(false);
                else {
                  setSeconds(0);
                  setRunning(true);
                }
              }}
            >
              {running ? t("check.stage.timer.stop") : t("check.stage.timer.start")}
            </Button>
          </div>
          <ol className="grid gap-[9px]">
            {SCRIPT.map((step, i) => (
              <li key={step.key} aria-current={running && scriptIndexAt(seconds) === i ? "step" : undefined} className={cn("rounded-tag px-[13px] py-[9px] text-body", running && scriptIndexAt(seconds) === i ? "bg-sticker-yellow" : "bg-bone")}>
                {t(step.key)}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

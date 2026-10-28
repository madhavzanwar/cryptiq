"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import type { CheckController } from "@/lib/hooks/checkController";
import { useT } from "@/lib/i18n/provider";
import { WifiOff } from "lucide-react";
import { AddressInput } from "./AddressInput";
import { ConfirmTranscript } from "./ConfirmTranscript";
import { DemoChips } from "./DemoChips";
import { MicButton } from "./MicButton";
import { VoiceProviderChip } from "./VoiceProviderChip";

/** "Check a wallet": mic, voice language, address field, examples, the primary button and the safety notes. */
export function InputCard({ c }: { c: CheckController }) {
  const { t } = useT();
  const { checking, noCredits, valid, online } = c;
  const blocked = checking || !online;

  return (
    <Card className="flex flex-col gap-[18px]" aria-labelledby="check-input-title">
      <div className="flex flex-wrap items-center justify-between gap-[13px]">
        <h2 id="check-input-title" className="sub">
          {t("check.input.title")}
        </h2>
        <Segmented
          label={t("check.voice.lang")}
          value={c.voiceLang}
          onChange={c.setVoiceLang}
          options={[
            { value: "en", label: t("check.voice.en"), lang: "en" },
            { value: "hi", label: t("check.voice.hi"), lang: "hi" },
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-[13px] py-[9px]">
        <MicButton voice={c.voice} disabled={blocked || c.transcript !== null} />
        <VoiceProviderChip lastProvider={c.voice.provider} usingBrowser={c.voice.usingBrowser} />
      </div>

      {c.secretWarning && (
        <Alert tone="error" title={t("check.secret.title")}>
          {t("check.secret.body")}
        </Alert>
      )}

      {c.transcript && (
        <ConfirmTranscript
          key={c.transcript.text}
          transcript={c.transcript}
          allowDemo={c.allowDemo}
          busy={blocked}
          onConfirm={c.confirmTranscript}
          onDismiss={c.dismissTranscript}
          onSecret={c.onSecret}
        />
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          c.submit();
        }}
        className="flex flex-col gap-[18px]"
      >
        <AddressInput value={c.value} onChange={c.setValue} onSecret={c.onSecret} allowDemo={c.allowDemo} inputRef={c.inputRef} disabled={checking} />
        <DemoChips onPick={c.pickDemo} selected={c.value} disabled={checking} />

        {c.duplicate && (
          <Alert
            tone="info"
            title={t("check.dup.title")}
            action={
              <div className="flex flex-wrap gap-[9px]">
                <Button variant="black" onClick={c.useCached}>{t("check.dup.use")}</Button>
                <Button variant="ghost" onClick={c.checkAgain}>{t("check.dup.again")}</Button>
              </div>
            }
          />
        )}

        {!online && (
          <Alert tone="warning">
            <span className="inline-flex items-center gap-[9px]">
              <WifiOff className="size-4" aria-hidden />
              {t("check.offline")}
            </span>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-[13px]">
          <span title={!valid && !noCredits ? t("check.btn.disabledTip") : undefined}>
            {noCredits ? (
              <Button variant="black" size="lg" onClick={() => c.submit()}>
                {t("action.buyCredits")}
              </Button>
            ) : (
              <Button type="submit" variant="black" size="lg" loading={checking} disabled={!valid || blocked}>
                {checking ? t("check.btn.checking") : t("check.btn.check")}
              </Button>
            )}
          </span>
          <Button variant="ghost" disabled={checking || c.value === ""} onClick={() => c.setValue("")}>
            {t("action.clear")}
          </Button>
        </div>
      </form>

      <div className="grid gap-[3px] text-small text-ash-gray">
        <p>{t("safety.public")}</p>
        <p>{t("privacy.note")}</p>
        <p className="hidden lg:block">{t("check.input.shortcut")}</p>
      </div>
    </Card>
  );
}

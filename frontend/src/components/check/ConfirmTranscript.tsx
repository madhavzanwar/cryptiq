"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { validateAddress } from "@/lib/address/validate";
import { looksLikeSecret } from "@/lib/address/seedGuard";
import type { VoiceResult } from "@/lib/voice/useVoiceInput";
import { useT } from "@/lib/i18n/provider";
import { useId, useState } from "react";

/**
 * After voice input: shows what was heard and the address we found, editable. Checking only starts when the
 * person presses "Confirm and check", because spoken addresses are easy to mishear.
 */
export function ConfirmTranscript({
  transcript,
  allowDemo,
  busy,
  onConfirm,
  onDismiss,
  onSecret,
}: {
  transcript: VoiceResult;
  allowDemo: boolean;
  busy?: boolean;
  onConfirm: (address: string) => void;
  onDismiss: () => void;
  onSecret: () => void;
}) {
  const { t } = useT();
  const id = useId();
  const [address, setAddress] = useState(transcript.address ?? "");
  const check = validateAddress(address, { allowDemo });
  return (
    <Card tint="bone" role="group" aria-labelledby={`${id}-t`} className="flex flex-col gap-[13px]">
      <h3 id={`${id}-t`} className="sub">
        {t("check.confirm.title")}
      </h3>
      <div>
        <p className="text-small text-ash-gray">{t("check.confirm.heard")}</p>
        <p className="text-body-lg" data-testid="transcript">
          “{transcript.text}”
        </p>
      </div>
      {transcript.address === null && address.trim() === "" && <p className="font-semibold text-block-ink">{t("check.confirm.none")}</p>}
      <div>
        <label htmlFor={`${id}-a`} className="mb-[9px] block text-body">
          {t("check.confirm.address")}
        </label>
        <input
          id={`${id}-a`}
          value={address}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            if (looksLikeSecret(e.target.value)) {
              setAddress("");
              onSecret();
            } else setAddress(e.target.value);
          }}
          aria-invalid={address.trim() !== "" && !check.ok ? true : undefined}
          className="h-[53px] w-full rounded-input border border-carbon bg-pure-white px-[26px] font-mono text-body-lg"
        />
      </div>
      <p className="text-small text-ash-gray">{t("check.confirm.note")}</p>
      <div className="flex flex-wrap gap-[13px]">
        <Button variant="black" size="lg" disabled={!check.ok || busy} onClick={() => check.ok && onConfirm(check.address)}>
          {t("check.confirm.go")}
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          {t("check.confirm.again")}
        </Button>
      </div>
    </Card>
  );
}

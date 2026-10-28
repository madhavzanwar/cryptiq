"use client";

import { Tag } from "@/components/ui/Tag";
import type { VoiceProvider } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { useHealth } from "@/lib/hooks/useApi";
import { VOICE_MODE } from "@/lib/env";
import { AudioLines } from "lucide-react";
import { useId } from "react";

const KEYS: Record<VoiceProvider, MessageKey> = {
  wispr: "check.voice.provider.wispr",
  sarvam: "check.voice.provider.sarvam",
  browser: "check.voice.provider.browser",
};

/**
 * Says which voice provider is active. Wispr Flow is only named when the API reports `wispr`;
 * `lastProvider` is what the last transcript actually used (it wins over the health answer).
 */
export function VoiceProviderChip({ lastProvider, usingBrowser = false }: { lastProvider?: VoiceProvider | null; usingBrowser?: boolean }) {
  const { t } = useT();
  const health = useHealth();
  const tipId = useId();
  const provider: VoiceProvider | null = usingBrowser || VOICE_MODE === "browser" ? "browser" : (lastProvider ?? health.data?.voiceProvider ?? null);
  const label = provider ? t(KEYS[provider]) : health.isError ? t("check.voice.provider.browser") : t("check.voice.provider.loading");
  return (
    <>
      <Tag tone="outline" title={t("check.voice.tip")} aria-describedby={tipId} data-provider={provider ?? "loading"}>
        <AudioLines className="size-4" aria-hidden />
        {label}
      </Tag>
      <span id={tipId} className="sr-only">
        {t("check.voice.tip")}
      </span>
    </>
  );
}

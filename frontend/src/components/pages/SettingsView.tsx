"use client";

import { PageHeader } from "@/components/pages/PageHeader";
import { Toggle } from "@/components/pages/Toggle";
import { useSaveHistory } from "@/components/pages/useSaveHistory";
import { Alert, Button, Card, Segmented, Skeleton, Tag } from "@/components/ui";
import type { Lang, VoiceProvider } from "@/lib/api/types";
import { API_BASE_URL, USE_MOCKS } from "@/lib/env";
import { useHealth } from "@/lib/hooks/useApi";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { useHistory } from "@/lib/stores/history";
import { useSettings } from "@/lib/stores/settings";
import { toast } from "@/lib/stores/toast";
import { useState, type ReactNode } from "react";

type VoiceChoice = "follow" | Lang;
const IS_DEV = process.env.NODE_ENV === "development";

const PROVIDER_LABEL: Record<VoiceProvider, MessageKey> = {
  wispr: "settings.provider.wispr",
  sarvam: "settings.provider.sarvam",
  browser: "settings.provider.browser",
};

function Row({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <Card className="grid gap-[13px]">
      <div>
        <h2 className="sub">{title}</h2>
        {help && <p className="measure mt-[4px] text-body text-ash-gray">{help}</p>}
      </div>
      {children}
    </Card>
  );
}

/** /settings: language, voice, history, motion, clear data, and developer details. */
export function SettingsView() {
  const { t } = useT();
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const voiceLang = useSettings((s) => s.voiceLang);
  const setVoiceLang = useSettings((s) => s.setVoiceLang);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const setReduceMotion = useSettings((s) => s.setReduceMotion);
  const { saveHistory, setSaveHistory } = useSaveHistory();
  const health = useHealth();
  const [confirmClear, setConfirmClear] = useState(false);

  const clearAll = () => {
    useHistory.getState().clear();
    useSettings.getState().reset();
    try {
      sessionStorage.clear();
      localStorage.removeItem("cryptiq.settings");
      localStorage.removeItem("cryptiq.history");
    } catch {
      /* storage blocked */
    }
    setConfirmClear(false);
    toast(t("settings.clear.done"), "success");
  };

  const failNext = async () => {
    const { mockConfig } = await import("@/lib/mocks");
    mockConfig.failNext = true;
    toast(t("settings.dev.failDone"), "warning");
  };

  const provider = health.data?.voiceProvider;

  return (
    <div className="container-page section-gap">
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} />

      <div className="grid max-w-[800px] gap-[26px]">
        <Row title={t("settings.lang.title")} help={t("settings.lang.help")}>
          <Segmented<Lang>
            label={t("settings.lang.title")}
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "English", lang: "en" },
              { value: "hi", label: "हिन्दी", lang: "hi" },
            ]}
          />
        </Row>

        <Row title={t("settings.voiceLang.title")} help={t("settings.voiceLang.help")}>
          <Segmented<VoiceChoice>
            label={t("settings.voiceLang.title")}
            value={voiceLang ?? "follow"}
            onChange={(v) => setVoiceLang(v === "follow" ? null : v)}
            options={[
              { value: "follow", label: t("settings.voiceLang.follow") },
              { value: "en", label: "English", lang: "en" },
              { value: "hi", label: "हिन्दी", lang: "hi" },
            ]}
          />
        </Row>

        <Row title={t("settings.provider.title")} help={t("settings.provider.note")}>
          {health.isPending ? (
            <Skeleton className="h-[34px] w-[220px]" />
          ) : provider ? (
            <p>
              <Tag tone={provider === "browser" ? "bone" : "allow"}>{t(PROVIDER_LABEL[provider])}</Tag>
            </p>
          ) : (
            <Alert tone="warning">{t("settings.provider.unknown")}</Alert>
          )}
        </Row>

        <Card>
          <h2 className="sr-only">{t("settings.history.title")}</h2>
          <Toggle checked={saveHistory} onChange={setSaveHistory} label={t("history.toggle")} help={t("history.toggle.help")} />
        </Card>

        <Card>
          <Toggle checked={reduceMotion} onChange={setReduceMotion} label={t("settings.motion.title")} help={t("settings.motion.help")} />
        </Card>

        <Row title={t("settings.clear.title")} help={t("settings.clear.help")}>
          {confirmClear ? (
            <div role="group" aria-label={t("settings.clear.confirm")} className="flex flex-wrap items-center gap-[13px]">
              <span className="text-body">{t("settings.clear.confirm")}</span>
              <Button variant="black" onClick={clearAll}>{t("settings.clear.yes")}</Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>{t("action.cancel")}</Button>
            </div>
          ) : (
            <div>
              <Button variant="ghost" onClick={() => setConfirmClear(true)}>{t("settings.clear.button")}</Button>
            </div>
          )}
        </Row>

        <Row title={t("settings.dev.title")}>
          <dl className="grid gap-[9px] text-body">
            <div className="flex flex-wrap gap-[9px]">
              <dt className="text-ash-gray">{t("settings.dev.source")}:</dt>
              <dd><Tag tone={USE_MOCKS ? "pink" : "bone"}>{USE_MOCKS ? t("settings.dev.mock") : t("settings.dev.real")}</Tag></dd>
            </div>
            {IS_DEV && (
              <div className="flex flex-wrap gap-[9px]">
                <dt className="text-ash-gray">{t("settings.dev.api")}:</dt>
                <dd className="mono text-small">{API_BASE_URL || t("settings.dev.sameOrigin")}</dd>
              </div>
            )}
            {health.data?.engine && (
              <div className="flex flex-wrap gap-[9px]">
                <dt className="text-ash-gray">{t("settings.dev.engine")}:</dt>
                <dd className="mono text-small">{health.data.engine}</dd>
              </div>
            )}
            {health.data?.dataSource && (
              <div className="flex flex-wrap gap-[9px]">
                <dt className="text-ash-gray">{t("settings.dev.dataset")}:</dt>
                <dd className="mono text-small">{health.data.dataSource}</dd>
              </div>
            )}
          </dl>
          {USE_MOCKS && (
            <div>
              <Button variant="ghost" onClick={() => void failNext()}>{t("settings.dev.fail")}</Button>
            </div>
          )}
        </Row>
      </div>
    </div>
  );
}

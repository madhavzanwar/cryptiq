"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { buildApiUrl } from "@/lib/hooks/checkAudio";
import type { CheckResponse, Lang } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { toast } from "@/lib/stores/toast";
import { isSpeechSynthesisSupported, speechLang } from "@/lib/voice/speech";
import { Pause, Play, Share2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buildSummary } from "./summary";

type ListenState = "idle" | "playing" | "paused";

const noopSubscribe = () => () => undefined;
const INSUFFICIENT = /insufficient evidence|पर्याप्त सबूत नहीं/i;

/** Plays the explanation: the backend's MP3 when it matches the tab's language, else the browser's speech synthesis. */
function useListen(result: CheckResponse, tab: Lang, requestLang: Lang) {
  const [state, setState] = useState<ListenState>("idle");
  const [progress, setProgress] = useState(0);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const useAudio = Boolean(result.audioUrl) && tab === requestLang;
  const supported = mounted && (useAudio || isSpeechSynthesisSupported());

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
    setState("idle");
    setProgress(0);
  }, []);

  // Changing tab or leaving the page stops playback.
  useEffect(() => stop, [tab, stop]);

  const toggle = useCallback(() => {
    if (state === "playing") {
      if (audioRef.current) audioRef.current.pause();
      else window.speechSynthesis.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      if (audioRef.current) void audioRef.current.play();
      else window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    const text = result.explanation[tab];
    /** Browser speech synthesis: used when there is no MP3, or when the MP3 cannot be played. */
    const speak = () => {
      if (!isSpeechSynthesisSupported()) return stop();
      audioRef.current = null;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = speechLang(tab);
      u.onboundary = (e) => setProgress(text.length > 0 ? Math.min(1, e.charIndex / text.length) : 0);
      u.onend = () => stop();
      u.onerror = () => stop();
      window.speechSynthesis.speak(u);
      setState("playing");
    };
    if (useAudio && result.audioUrl) {
      const audio = new Audio(buildApiUrl(result.audioUrl));
      audioRef.current = audio;
      let fellBack = false;
      const fallBack = () => {
        if (fellBack) return;
        fellBack = true;
        speak();
      };
      audio.ontimeupdate = () => setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
      audio.onended = () => stop();
      audio.onerror = fallBack;
      void audio.play().then(() => setState("playing"), fallBack);
    } else {
      speak();
    }
  }, [result.audioUrl, result.explanation, state, stop, tab, useAudio]);

  return { state, progress, supported, toggle };
}

/**
 * The explanation in English and Hindi. It only repeats facts from the evidence ("Based only on retrieved evidence");
 * the "insufficient evidence" case is shown plainly. Listen, copy and share-summary live here.
 */
export function ExplanationPanel({ result, requestLang, className }: { result: CheckResponse; requestLang?: Lang; className?: string }) {
  const { t, lang } = useT();
  // The tab follows the UI language until the person picks one.
  const [picked, setPicked] = useState<{ lang: Lang; tab: Lang } | null>(null);
  const tab: Lang = picked && picked.lang === lang ? picked.tab : lang;
  const setTab = (next: Lang) => setPicked({ lang, tab: next });
  const listen = useListen(result, tab, requestLang ?? lang);
  const insufficient = result.status !== "ok" || INSUFFICIENT.test(result.explanation[tab]);

  const share = async () => {
    const text = buildSummary(result, tab);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Cryptiq", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast(t("check.explain.shared"), "success");
    } catch {
      /* the share sheet was dismissed */
    }
  };

  return (
    <Card className={className} aria-labelledby="explain-title">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[9px]">
        <h2 id="explain-title" className="sub">
          {t("check.explain.title")}
        </h2>
        <Tag tone="bone">
          <ShieldCheck className="size-4" aria-hidden />
          {t("check.explain.basis")}
        </Tag>
      </div>
      <Tabs
        label={t("check.explain.title")}
        value={tab}
        onChange={setTab}
        items={(["en", "hi"] as const).map((l) => ({
          id: l,
          lang: l,
          label: t(`check.explain.tab.${l}` as const),
          panel: (
            <div className="grid gap-[13px]">
              {insufficient && <p className="rounded-tag bg-bone px-[13px] py-[9px] text-small">{t("check.explain.insufficient")}</p>}
              <p lang={l} className="measure text-body-lg">
                {result.explanation[l]}
              </p>
            </div>
          ),
        }))}
      />
      <div className="mt-[26px] flex flex-wrap items-center gap-[9px]">
        {listen.supported && (
          <Button variant="ghost" onClick={listen.toggle} aria-pressed={listen.state === "playing"}>
            {listen.state === "playing" ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {listen.state === "playing" ? t("check.explain.pause") : t("check.explain.listen")}
          </Button>
        )}
        <CopyButton value={result.explanation[tab]} label={t("check.explain.copyText")} className="border border-carbon" />
        <Button variant="ghost" onClick={share}>
          <Share2 className="size-4" aria-hidden />
          {t("check.explain.share")}
        </Button>
      </div>
      {listen.state !== "idle" && (
        <div className="mt-[13px] h-[7px] rounded-full bg-plaster" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(listen.progress * 100)} aria-label={t("check.explain.listen")}>
          <div className="h-full rounded-full bg-carbon transition-[width] duration-200" style={{ width: `${Math.round(listen.progress * 100)}%` }} />
        </div>
      )}
      {listen.supported && <p className="mt-[9px] text-small text-ash-gray">{t("check.explain.voiceNote")}</p>}
    </Card>
  );
}

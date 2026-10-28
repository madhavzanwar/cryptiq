"use client";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { TAP_MS, formatTimer } from "@/lib/voice/record";
import type { VoiceErrorKind, VoiceInput } from "@/lib/voice/useVoiceInput";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Waveform } from "./Waveform";

const ERROR_KEYS: Record<VoiceErrorKind, MessageKey> = {
  denied: "check.mic.err.denied",
  no_mic: "check.mic.err.noMic",
  empty: "check.mic.err.empty",
  failed: "check.mic.err.failed",
  unavailable: "check.mic.err.unavailable",
};

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
/** Space on another control (a button, a link, a tab) must still activate that control. */
const isOtherControl = (el: EventTarget | null) =>
  el instanceof HTMLElement && el.closest("a,button,summary,[role=button],[role=tab],[role=radio]") !== null && el.closest("[data-mic]") === null;

/**
 * Push-to-talk. Hold the button (or hold Space) to record and release to send. A quick tap starts a
 * recording that a second tap sends, so the control also works for people who cannot hold it.
 */
export function MicButton({ voice, size = "md", disabled = false, shortcut = true, className }: { voice: VoiceInput; size?: "md" | "xl"; disabled?: boolean; shortcut?: boolean; className?: string }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const live = useRef(voice);
  useEffect(() => {
    live.current = voice; // handlers read the latest voice state from the ref
  });
  const downAt = useRef(0);
  const [sticky, setSticky] = useState(false);
  const stickyRef = useRef(false);
  const setSt = (v: boolean) => {
    stickyRef.current = v;
    setSticky(v);
  };

  const status = voice.status;
  const busy = status === "requesting" || status === "recording" || status === "transcribing";
  const unsupported = status === "unsupported";
  const off = disabled || unsupported;

  const press = () => {
    const v = live.current;
    if (v.status === "recording" || v.status === "requesting") {
      if (stickyRef.current) {
        setSt(false);
        downAt.current = 0;
        v.stop();
      }
      return;
    }
    if (v.status === "transcribing" || v.status === "unsupported") return;
    if (v.status === "error") v.reset();
    downAt.current = Date.now();
    setSt(false);
    v.start();
  };
  const release = () => {
    if (downAt.current === 0) return;
    const held = Date.now() - downAt.current;
    downAt.current = 0;
    if (held < TAP_MS) setSt(true); // a tap: keep recording until the next tap
    else live.current.stop();
  };

  // Keyboard: hold Space to talk (not while typing or on another control); Esc cancels.
  useEffect(() => {
    if (!shortcut || off) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ["recording", "requesting"].includes(live.current.status)) {
        setSt(false);
        downAt.current = 0;
        live.current.cancel();
        return;
      }
      if (e.code !== "Space" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditable(e.target) || isOtherControl(e.target)) return;
      e.preventDefault();
      press();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isEditable(e.target) || isOtherControl(e.target)) return;
      e.preventDefault();
      release();
    };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
    };
    // press/release only read refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut, off]);

  const sizeCls = size === "xl" ? "size-[120px] sm:size-[168px]" : "size-[88px] sm:size-[105px]";
  const tone =
    status === "recording"
      ? "bg-block text-pure-white"
      : status === "transcribing" || status === "requesting"
        ? "bg-bone text-carbon"
        : status === "error" || off
          ? "bg-plaster text-slate-gray"
          : "bg-acid-lime text-carbon hover:bg-carbon hover:text-pure-white";
  const iconSize = size === "xl" ? "size-10 sm:size-14" : "size-8 sm:size-9";

  let caption: string;
  if (unsupported) caption = t("check.mic.unsupported");
  else if (status === "requesting") caption = t("check.mic.requesting");
  else if (status === "recording") caption = `${formatTimer(voice.elapsed)} · ${t(sticky ? "check.mic.recordingToggle" : "check.mic.recording")}`;
  else if (status === "transcribing") caption = t("check.mic.transcribing");
  else if (status === "error" && voice.error) caption = voice.error.kind === "failed" && voice.error.message ? voice.error.message : t(ERROR_KEYS[voice.error.kind]);
  else caption = t("check.mic.hold");

  return (
    <div className={cn("flex flex-col items-center gap-[13px]", className)}>
      <div className="relative">
        {status === "idle" && !off && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-[9px] rounded-full border-2 border-carbon"
            initial={{ scale: 0.92, opacity: 0.7 }}
            animate={reduce ? { scale: 1, opacity: 0.35 } : { scale: [0.92, 1.22], opacity: [0.7, 0] }}
            transition={reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <button
          type="button"
          data-mic
          disabled={off}
          aria-label={t("check.mic.aria")}
          aria-pressed={status === "recording"}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            press();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onClick={(e) => {
            if (e.detail !== 0) return; // pointer clicks are handled above; this is keyboard Enter
            if (live.current.status === "recording") {
              setSt(false);
              live.current.stop();
            } else {
              setSt(true);
              live.current.start();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "relative inline-flex touch-none select-none items-center justify-center rounded-full border border-carbon transition-[background-color,color,transform] duration-[120ms] ease-out active:scale-[0.96] disabled:cursor-not-allowed",
            sizeCls,
            tone,
          )}
        >
          {status === "recording" ? (
            <Waveform analyser={voice.analyser} />
          ) : status === "transcribing" || status === "requesting" ? (
            <Spinner className={iconSize} />
          ) : status === "error" || unsupported ? (
            <MicOff className={iconSize} aria-hidden strokeWidth={2} />
          ) : (
            <Mic className={iconSize} aria-hidden strokeWidth={2} />
          )}
        </button>
      </div>
      <p aria-live="polite" className={cn("measure text-center text-small text-ash-gray", size === "xl" && "text-body-lg", status === "error" && "text-block-ink")}>
        {caption}
      </p>
      {status === "error" && (
        <button type="button" onClick={() => voice.reset()} className="min-h-11 rounded-button border border-carbon px-[18px] text-body transition-colors duration-[120ms] hover:bg-carbon hover:text-pure-white">
          {t("check.mic.retry")}
        </button>
      )}
      {busy && status === "recording" && <span className="sr-only" role="status">{t("check.mic.recording")}</span>}
    </div>
  );
}

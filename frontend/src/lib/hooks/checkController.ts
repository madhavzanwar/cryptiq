"use client";

import { validateAddress } from "@/lib/address/validate";
import type { Lang } from "@/lib/api/types";
import { USE_MOCKS } from "@/lib/env";
import { useCreditsQuery, useHealth } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { useCredits } from "@/lib/stores/credits";
import { selectVoiceLang, useSettings } from "@/lib/stores/settings";
import { useUi } from "@/lib/stores/ui";
import { useVoiceInput, type VoiceInput, type VoiceResult } from "@/lib/voice/useVoiceInput";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { findRecent, useCheckFlow, type CheckFlow } from "./checkFlow";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
/** `navigator.onLine`, kept in step with the browser's online/offline events (true during server render). */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export interface CheckController {
  lang: Lang;
  value: string;
  setValue: (v: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** DEMO- placeholders are valid (mock mode, or a backend on the synthetic fixture). */
  allowDemo: boolean;
  valid: boolean;
  /** A seed phrase / key was blocked: the red alert is showing. */
  secretWarning: boolean;
  dismissSecret: () => void;
  onSecret: () => void;
  voice: VoiceInput;
  voiceLang: Lang;
  setVoiceLang: (l: Lang) => void;
  /** What the microphone heard, waiting for "Confirm and check". */
  transcript: VoiceResult | null;
  dismissTranscript: () => void;
  confirmTranscript: (address: string) => void;
  flow: CheckFlow;
  checking: boolean;
  online: boolean;
  balance: number | null;
  noCredits: boolean;
  /** Address of a check done in the last 10 minutes that the person is about to repeat. */
  duplicate: string | null;
  useCached: () => void;
  checkAgain: () => void;
  pickDemo: (address: string) => void;
  /** Validate, apply the credit gate and the duplicate prompt, then run the check. */
  submit: () => void;
  /** Run a specific address right away (stage mode buttons). */
  runAddress: (address: string, opts?: { force?: boolean }) => void;
  retry: () => void;
}

/** One brain for the check experience: used by /check and by stage mode (/demo). */
export function useCheckController(): CheckController {
  const { lang } = useT();
  const voiceLang = useSettings(selectVoiceLang);
  const health = useHealth();
  useCreditsQuery(); // fills the credits store so the top-bar pill and the gate know the balance
  const balance = useCredits((s) => s.balance);
  const online = useOnline();
  const flow = useCheckFlow();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValueState] = useState("");
  const [secretWarning, setSecretWarning] = useState(false);
  const [transcript, setTranscript] = useState<VoiceResult | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);

  const allowDemo = USE_MOCKS || health.data?.mocks === true;
  const valid = validateAddress(value, { allowDemo }).ok;
  const checking = flow.state.phase === "checking";
  const noCredits = balance === 0;

  const setValue = useCallback((v: string) => {
    setValueState(v);
    setDuplicate(null);
    if (v !== "") setSecretWarning(false);
  }, []);

  /** Seed phrase or key: clear everything that could hold it, do not send, store or log it. */
  const onSecret = useCallback(() => {
    setValueState("");
    setTranscript(null);
    setDuplicate(null);
    setSecretWarning(true);
  }, []);

  const voice = useVoiceInput({
    lang: voiceLang,
    allowDemo,
    onResult: (r) => {
      setSecretWarning(false);
      setTranscript(r);
    },
    onSecret,
  });

  const runAddress = useCallback(
    (address: string, opts?: { force?: boolean }) => {
      const v = validateAddress(address, { allowDemo });
      if (!v.ok || !online) return;
      if (useCredits.getState().balance === 0) {
        useUi.getState().openCredits();
        return;
      }
      setDuplicate(null);
      if (!opts?.force && findRecent(v.address)) {
        setDuplicate(v.address);
        return;
      }
      void flow.run(v.address, lang).then((o) => {
        if (o.status !== "error") return;
        if (o.action === "open-credits") useUi.getState().openCredits();
        else if (o.action === "seed-phrase-warning") onSecret();
        else if (o.action === "fix-address") inputRef.current?.focus();
      });
    },
    [allowDemo, flow, lang, online, onSecret],
  );

  const submit = useCallback(() => {
    if (noCredits) return useUi.getState().openCredits();
    runAddress(value);
  }, [noCredits, runAddress, value]);

  const confirmTranscript = useCallback(
    (address: string) => {
      setValueState(address);
      setTranscript(null);
      runAddress(address);
    },
    [runAddress],
  );

  const useCached = useCallback(() => {
    if (!duplicate) return;
    const prev = findRecent(duplicate);
    setDuplicate(null);
    if (prev) flow.show({ ...prev.result, cached: true }, prev.lang, { entryId: prev.entryId });
  }, [duplicate, flow]);

  const checkAgain = useCallback(() => {
    if (duplicate) runAddress(duplicate, { force: true });
  }, [duplicate, runAddress]);

  const retry = useCallback(() => {
    const s = flow.state;
    runAddress(s.phase === "error" && s.address ? s.address : value, { force: true });
  }, [flow.state, runAddress, value]);

  // "/" jumps to the address box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return {
    lang,
    value,
    setValue,
    inputRef,
    allowDemo,
    valid,
    secretWarning,
    dismissSecret: () => setSecretWarning(false),
    onSecret,
    voice,
    voiceLang,
    setVoiceLang: (l) => useSettings.getState().setVoiceLang(l),
    transcript,
    dismissTranscript: () => setTranscript(null),
    confirmTranscript,
    flow,
    checking,
    online,
    balance,
    noCredits,
    duplicate,
    useCached,
    checkAgain,
    pickDemo: (address) => {
      setValue(address);
      inputRef.current?.focus();
    },
    submit,
    runAddress,
    retry,
  };
}

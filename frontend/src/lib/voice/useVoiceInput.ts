"use client";

import { extractAddress } from "@/lib/address/validate";
import { looksLikeSecret } from "@/lib/address/seedGuard";
import { isApiError, messageFor } from "@/lib/api/errors";
import { api } from "@/lib/api/instance";
import type { Lang, VoiceProvider } from "@/lib/api/types";
import { VOICE_MODE } from "@/lib/env";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MAX_RECORD_SECONDS, MIN_RECORD_MS, isRecorderSupported, pickMimeType } from "./record";
import { finalTranscript, getSpeechRecognitionCtor, speechLang, type SpeechRecognitionLike } from "./speech";

export type VoiceStatus = "idle" | "requesting" | "recording" | "transcribing" | "error" | "unsupported";
export type VoiceErrorKind = "denied" | "no_mic" | "empty" | "failed" | "unavailable";

export interface VoiceError {
  kind: VoiceErrorKind;
  /** Friendly text from the API error table when the server said no (EN/HI). */
  message?: string;
}

export interface VoiceResult {
  /** What was heard, shown to the person for confirmation. */
  text: string;
  /** The address found in it, or null. */
  address: string | null;
  provider: VoiceProvider;
}

type Capability = "unknown" | "recorder" | "speech" | "none";
const noopSubscribe = () => () => undefined;
function getCapability(): Capability {
  const speech = getSpeechRecognitionCtor() !== null;
  if (VOICE_MODE === "browser") return speech ? "speech" : "none";
  return isRecorderSupported() ? "recorder" : speech ? "speech" : "none";
}

export interface UseVoiceInputOptions {
  lang: Lang;
  /** Accept DEMO- placeholders when extracting an address from browser speech. */
  allowDemo: boolean;
  onResult: (r: VoiceResult) => void;
  /** Called (instead of onResult) when the audio/transcript looks like a seed phrase or key. */
  onSecret: () => void;
}

export interface VoiceInput {
  status: VoiceStatus;
  error: VoiceError | null;
  /** Seconds recorded so far. */
  elapsed: number;
  /** Live loudness source for the waveform (server path and best-effort on the browser path). */
  analyser: AnalyserNode | null;
  /** Provider of the last transcript, or "browser" when the browser path is in use. */
  provider: VoiceProvider | null;
  /** True when speech goes through the browser instead of POST /api/transcribe. */
  usingBrowser: boolean;
  start: () => void;
  /** Stops recording and sends it for transcription. */
  stop: () => void;
  /** Stops and throws the recording away. */
  cancel: () => void;
  reset: () => void;
}

/**
 * Push-to-talk voice input. Server path: MediaRecorder (webm/opus) -> POST /api/transcribe.
 * Browser path: Web Speech API (hi-IN / en-IN), used when NEXT_PUBLIC_VOICE_MODE=browser, when
 * MediaRecorder is missing, or after the server answered 503 voice_unavailable.
 */
export function useVoiceInput(options: UseVoiceInputOptions): VoiceInput {
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options; // handlers always see the latest callbacks without re-creating the hook
  });

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<VoiceError | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [provider, setProvider] = useState<VoiceProvider | null>(null);
  const [browserForced, setBrowserForced] = useState(false);
  // What this browser can do. Server render says "unknown"; the client answer comes from the real APIs.
  const capability = useSyncExternalStore(noopSubscribe, getCapability, () => "unknown" as Capability);

  const statusRef = useRef<VoiceStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const recErrorRef = useRef<VoiceErrorKind | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);
  const stopAskedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const move = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const releaseMedia = useCallback(() => {
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setAnalyser(null);
  }, []);

  const fail = useCallback(
    (kind: VoiceErrorKind, message?: string) => {
      releaseMedia();
      setError({ kind, message });
      move("error");
    },
    [move, releaseMedia],
  );

  const deliver = useCallback(
    (text: string, address: string | null, prov: VoiceProvider) => {
      const { onResult, onSecret, allowDemo } = optsRef.current;
      setProvider(prov);
      if (looksLikeSecret(text) || (address !== null && looksLikeSecret(address))) {
        move("idle");
        onSecret();
        return;
      }
      move("idle");
      onResult({ text, address: address ?? extractAddress(text, { allowDemo }), provider: prov });
    },
    [move],
  );

  const attachAnalyser = useCallback((stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(node);
      ctxRef.current = ctx;
      setAnalyser(node);
    } catch {
      /* the waveform is decorative: recording still works without it */
    }
  }, []);

  const beginTimer = useCallback(
    (onLimit: () => void) => {
      startedAtRef.current = Date.now();
      setElapsed(0);
      window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const s = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(s);
        if (s >= MAX_RECORD_SECONDS) onLimit();
      }, 250);
    },
    [],
  );

  // ---------------------------------------------------------------- server path
  const transcribe = useCallback(
    async (blob: Blob, gen: number) => {
      move("transcribing");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await api.transcribe(blob, optsRef.current.lang, { signal: ctrl.signal });
        if (gen !== generation.current) return;
        if (res.text.trim() === "" && !res.address) return fail("empty");
        deliver(res.text, res.address, res.provider);
      } catch (e) {
        if (gen !== generation.current) return;
        if (isApiError(e) && e.code === "aborted") return move("idle");
        if (isApiError(e) && e.code === "secret_input") {
          move("idle");
          optsRef.current.onSecret();
          return;
        }
        if (isApiError(e) && e.code === "voice_unavailable") {
          setBrowserForced(true); // next press uses the browser's speech recognition
          return fail("unavailable", messageFor(e, optsRef.current.lang).message);
        }
        fail("failed", messageFor(e, optsRef.current.lang).message);
      }
    },
    [deliver, fail, move],
  );

  const startServer = useCallback(async () => {
    const gen = ++generation.current;
    discardRef.current = false;
    stopAskedRef.current = false;
    setError(null);
    move("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      if (gen !== generation.current) return;
      const name = e instanceof DOMException ? e.name : "";
      return fail(name === "NotFoundError" || name === "DevicesNotFoundError" ? "no_mic" : "denied");
    }
    if (gen !== generation.current || stopAskedRef.current) {
      stream.getTracks().forEach((t) => t.stop()); // released before the mic opened: nothing to send
      if (gen === generation.current) move("idle");
      return;
    }
    streamRef.current = stream;
    attachAnalyser(stream);
    chunksRef.current = [];
    const mime = pickMimeType((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      const heldMs = Date.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mime || "audio/webm" });
      releaseMedia();
      if (discardRef.current || gen !== generation.current) return move("idle");
      if (heldMs < MIN_RECORD_MS || blob.size < 800) return fail("empty");
      void transcribe(blob, gen);
    };
    recorder.start();
    move("recording");
    beginTimer(() => {
      if (recorder.state === "recording") recorder.stop();
    });
  }, [attachAnalyser, beginTimer, fail, move, releaseMedia, transcribe]);

  // ---------------------------------------------------------------- browser path
  const startBrowser = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return move("unsupported");
    const gen = ++generation.current;
    discardRef.current = false;
    stopAskedRef.current = false;
    setError(null);
    transcriptRef.current = "";
    recErrorRef.current = null;
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = speechLang(optsRef.current.lang);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = finalTranscript(e.results);
      if (text) transcriptRef.current = text;
    };
    rec.onerror = (e) => {
      recErrorRef.current =
        e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : e.error === "audio-capture" ? "no_mic" : e.error === "no-speech" ? "empty" : "failed";
    };
    rec.onend = () => {
      recognitionRef.current = null;
      releaseMedia();
      if (discardRef.current || gen !== generation.current) return move("idle");
      const text = transcriptRef.current.trim();
      if (text === "") return fail(recErrorRef.current ?? "empty");
      deliver(text, null, "browser");
    };
    try {
      move("requesting");
      rec.start();
      move("recording");
      beginTimer(() => rec.stop());
      // best effort: a second look at the microphone just to drive the waveform
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (gen !== generation.current || statusRef.current !== "recording") stream.getTracks().forEach((t) => t.stop());
        else {
          streamRef.current = stream;
          attachAnalyser(stream);
        }
      } catch {
        /* no waveform, recognition still runs */
      }
    } catch {
      fail("failed");
    }
  }, [attachAnalyser, beginTimer, deliver, fail, move, releaseMedia]);

  const usingBrowser = capability === "speech" || browserForced;

  const start = useCallback(() => {
    if (statusRef.current !== "idle" && statusRef.current !== "error") return;
    if (capability === "none") return move("unsupported");
    if (capability === "unknown") return;
    if (usingBrowser) void startBrowser();
    else void startServer();
  }, [capability, move, startBrowser, startServer, usingBrowser]);

  const stop = useCallback(() => {
    stopAskedRef.current = true;
    if (statusRef.current === "requesting") {
      discardRef.current = true; // released before the mic opened
      return;
    }
    if (statusRef.current !== "recording") return;
    if (recognitionRef.current) recognitionRef.current.stop();
    else if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    stopAskedRef.current = true;
    generation.current++;
    abortRef.current?.abort();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    releaseMedia();
    move("idle");
  }, [move, releaseMedia]);

  const reset = useCallback(() => {
    setError(null);
    if (statusRef.current === "error") move("idle");
  }, [move]);

  // Clean up when the page goes away.
  useEffect(
    () => () => {
      generation.current++;
      abortRef.current?.abort();
      recognitionRef.current?.abort();
      if (recorderRef.current?.state === "recording") {
        discardRef.current = true;
        recorderRef.current.stop();
      }
      window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close().catch(() => undefined);
    },
    [],
  );

  return {
    status: capability === "none" ? "unsupported" : status,
    error,
    elapsed,
    analyser,
    provider: provider ?? (usingBrowser ? "browser" : null),
    usingBrowser,
    start,
    stop,
    cancel,
    reset,
  };
}

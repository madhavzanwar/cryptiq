"use client";

import { isApiError, messageFor, type ErrorAction } from "@/lib/api/errors";
import { api, apiOptions } from "@/lib/api/instance";
import { streamCheck } from "@/lib/api/sse";
import type { CheckResponse, Lang, StepEvent } from "@/lib/api/types";
import { translate } from "@/lib/i18n";
import { useCredits } from "@/lib/stores/credits";
import { useHistory } from "@/lib/stores/history";
import { toast } from "@/lib/stores/toast";
import { useCallback, useEffect, useReducer, useRef } from "react";

export const STEP_IDS = ["validate", "graph", "hops", "score", "explain"] as const;
export type StepId = (typeof STEP_IDS)[number];
/** A check that takes longer than this ends with a friendly "try again". */
export const CHECK_TIMEOUT_MS = 15_000;
/** The backend serves repeats of the same address from its cache (free) for this long. */
export const RECENT_MS = 10 * 60 * 1000;

export type FlowState =
  | { phase: "idle" }
  | { phase: "checking"; address: string; steps: StepEvent[]; startedAt: number }
  | { phase: "done"; result: CheckResponse; lang: Lang; entryId?: string; replay?: boolean }
  | { phase: "error"; address: string; code: string; message: string; action: ErrorAction; body?: CheckResponse };

export type FlowAction =
  | { type: "start"; address: string; now: number }
  | { type: "step"; step: StepEvent }
  | { type: "success"; result: CheckResponse; lang: Lang; entryId?: string; replay?: boolean }
  | { type: "failure"; code: string; message: string; action: ErrorAction; body?: CheckResponse }
  | { type: "cancel" }
  | { type: "reset" };

export const initialFlow: FlowState = { phase: "idle" };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "start":
      return { phase: "checking", address: action.address, steps: [], startedAt: action.now };
    case "step":
      if (state.phase !== "checking") return state;
      return {
        ...state,
        steps: [...state.steps.filter((s) => s.id !== action.step.id), action.step],
      };
    case "success":
      return { phase: "done", result: action.result, lang: action.lang, entryId: action.entryId, replay: action.replay };
    case "failure":
      return {
        phase: "error",
        address: state.phase === "checking" ? state.address : "",
        code: action.code,
        message: action.message,
        action: action.action,
        body: action.body,
      };
    case "cancel":
    case "reset":
      return initialFlow;
  }
}

/** Index (0-based) of the step currently running, or -1 before the first step. */
export function activeStepIndex(steps: StepEvent[]): number {
  let idx = -1;
  for (const s of steps) idx = Math.max(idx, STEP_IDS.indexOf(s.id as StepId));
  return idx;
}

export interface RecentCheck {
  at: number;
  result: CheckResponse;
  lang: Lang;
  entryId?: string;
}

const recentChecks = new Map<string, RecentCheck>();
const recentKey = (address: string) => address.trim().toLowerCase();

/** A check of the same address in the last 10 minutes, if there is one (module-level: shared by /check and /demo). */
export function findRecent(address: string, now = Date.now()): RecentCheck | undefined {
  const hit = recentChecks.get(recentKey(address));
  return hit && now - hit.at < RECENT_MS ? hit : undefined;
}
export function clearRecent(): void {
  recentChecks.clear();
}

/** The stream is unusable (not there / cut off before any step): the plain endpoint may still work. */
export function canFallBackToPlain(error: unknown, sawStep: boolean): boolean {
  if (!isApiError(error) || sawStep) return false;
  return error.status === 404 || error.status === 405 || error.status === 501 || error.code === "invalid_response" || error.code === "stream_ended";
}

/** Shows labelled steps only while the real call is still running, so it can never be slower than the call. */
async function withSimulatedSteps<T>(call: Promise<T>, onStep: (s: StepEvent) => void, labels: StepEvent[]): Promise<T> {
  let i = 0;
  if (labels[0]) onStep(labels[0]);
  const timer = window.setInterval(() => {
    i += 1;
    const next = labels[i];
    if (next) onStep(next);
  }, 350);
  try {
    return await call;
  } finally {
    window.clearInterval(timer);
  }
}

/** How a check ended, so the caller can react to it from an event handler (no effect needed). */
export type FlowOutcome = { status: "done" } | { status: "cancelled" } | { status: "error"; code: string; action: ErrorAction };

export interface CheckFlow {
  state: FlowState;
  /** Runs a check. Resolves when it finished (or failed / was cancelled). */
  run: (address: string, lang: Lang) => Promise<FlowOutcome>;
  cancel: () => void;
  reset: () => void;
  /** Shows a result without calling the API or touching credits (cached repeat, stage-mode replay). */
  show: (result: CheckResponse, lang: Lang, opts?: { entryId?: string; replay?: boolean }) => void;
}

export function useCheckFlow(): CheckFlow {
  const [state, dispatch] = useReducer(flowReducer, initialFlow);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (address: string, lang: Lang): Promise<FlowOutcome> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    dispatch({ type: "start", address, now: Date.now() });

    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, CHECK_TIMEOUT_MS);
    let sawStep = false;

    try {
      let res: CheckResponse;
      try {
        res = await streamCheck(
          apiOptions,
          address,
          lang,
          {
            onStep: (s) => {
              sawStep = true;
              dispatch({ type: "step", step: s });
            },
          },
          ctrl.signal,
        );
      } catch (e) {
        if (!canFallBackToPlain(e, sawStep)) throw e;
        const labels = STEP_IDS.map((id) => ({ id, label: translate(lang, `check.step.${id}` as const) }));
        res = await withSimulatedSteps(api.check(address, lang, { signal: ctrl.signal }), (s) => dispatch({ type: "step", step: s }), labels);
      }
      if (abortRef.current !== ctrl) return { status: "cancelled" }; // a newer check took over

      // Credits, toast, history: only for a real answer from the server.
      useCredits.getState().applyCheck(res);
      if (res.status === "ok" && res.cached !== true && res.creditsRemaining !== undefined) {
        toast(translate(lang, "check.creditUsed", { n: res.creditsRemaining }), "success");
      }
      const entry = useHistory.getState().add(res);
      recentChecks.set(recentKey(address), { at: Date.now(), result: res, lang, entryId: entry.id });
      dispatch({ type: "success", result: res, lang, entryId: entry.id });
      return { status: "done" };
    } catch (e) {
      if (abortRef.current !== ctrl) return { status: "cancelled" };
      if (ctrl.signal.aborted && !timedOut) {
        dispatch({ type: "cancel" });
        return { status: "cancelled" };
      }
      if (timedOut) {
        dispatch({ type: "failure", code: "timeout", message: translate(lang, "check.timeout"), action: "retry-later" });
        return { status: "error", code: "timeout", action: "retry-later" };
      }
      const m = messageFor(e, lang);
      const code = isApiError(e) ? e.code : "unknown";
      dispatch({ type: "failure", code, message: m.message, action: m.action, body: isApiError(e) ? e.body : undefined });
      return { status: "error", code, action: m.action };
    } finally {
      window.clearTimeout(timer);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "cancel" });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  const show = useCallback((result: CheckResponse, lang: Lang, opts?: { entryId?: string; replay?: boolean }) => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "success", result, lang, entryId: opts?.entryId, replay: opts?.replay });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, run, cancel, reset, show };
}

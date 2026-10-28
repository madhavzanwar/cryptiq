"use client";

import type { CheckResponse } from "@/lib/api/types";
import { create } from "zustand";

export interface CreditActivity {
  id: string;
  at: string;
  kind: "check" | "topup";
  delta: number;
  note: string;
}

export interface CreditsState {
  /** null until the first /api/credits answer. */
  balance: number | null;
  /** Credits spent / added in this browser session (not persisted). */
  activity: CreditActivity[];
  /** Bumps whenever the balance goes down, so the pill can play its tick. */
  tick: number;
  setBalance: (balance: number) => void;
  /** Call after a successful check: uses `creditsRemaining` and records a charged check. */
  applyCheck: (result: CheckResponse) => void;
  /** Call when a top-up is confirmed. */
  applyTopup: (credits: number, note: string) => void;
}

const id = () => Math.random().toString(36).slice(2, 10);

export const useCredits = create<CreditsState>()((set, get) => ({
  balance: null,
  activity: [],
  tick: 0,
  setBalance: (balance) => set({ balance }),
  applyCheck: (result) => {
    const before = get().balance;
    const after = result.creditsRemaining;
    if (after === undefined) return;
    const charged = !result.cached && result.status === "ok";
    set((s) => ({
      balance: after,
      tick: before !== null && after < before ? s.tick + 1 : s.tick,
      activity: charged
        ? [{ id: id(), at: new Date().toISOString(), kind: "check" as const, delta: -1, note: result.address }, ...s.activity].slice(0, 50)
        : s.activity,
    }));
  },
  applyTopup: (credits, note) =>
    set((s) => ({
      balance: (s.balance ?? 0) + credits,
      activity: [{ id: id(), at: new Date().toISOString(), kind: "topup" as const, delta: credits, note }, ...s.activity].slice(0, 50),
    })),
}));

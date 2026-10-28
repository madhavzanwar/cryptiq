"use client";

import type { CheckResponse } from "@/lib/api";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { useSettings } from "./settings";

export interface HistoryEntry {
  /** Stable id used in /r/[id]. */
  id: string;
  /** ISO time of the check. */
  at: string;
  result: CheckResponse;
  /** Set after a successful attestation. */
  attestationUid?: string;
}

const MAX_ENTRIES = 30;

export interface HistoryState {
  entries: HistoryEntry[];
  /** Always keeps the latest result in memory for this tab (permalink, reload-free navigation). */
  add: (result: CheckResponse) => HistoryEntry;
  get: (id: string) => HistoryEntry | undefined;
  setAttestation: (id: string, uid: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** Only writes to localStorage while "Save my checks on this device" is on. Never uploaded anywhere. */
const guardedStorage: StateStorage = {
  getItem: (name) => (typeof localStorage === "undefined" ? null : localStorage.getItem(name)),
  setItem: (name, value) => {
    if (useSettings.getState().saveHistory) localStorage.setItem(name, value);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useHistory = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      add: (result) => {
        const entry: HistoryEntry = { id: newId(), at: new Date().toISOString(), result };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }));
        return entry;
      },
      get: (id) => get().entries.find((e) => e.id === id),
      setAttestation: (id, uid) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, attestationUid: uid } : e)) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => {
        set({ entries: [] });
        if (typeof localStorage !== "undefined") localStorage.removeItem("cryptiq.history");
      },
    }),
    {
      name: "cryptiq.history",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => guardedStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

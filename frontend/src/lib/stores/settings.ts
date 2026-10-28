"use client";

import type { Lang } from "@/lib/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  /** UI language. */
  lang: Lang;
  /** Language for speech and spoken explanation; null follows `lang`. */
  voiceLang: Lang | null;
  /** History is OFF by default and never leaves this device. */
  saveHistory: boolean;
  /** Extra switch on top of the OS setting. */
  reduceMotion: boolean;
  setLang: (lang: Lang) => void;
  setVoiceLang: (lang: Lang | null) => void;
  setSaveHistory: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  reset: () => void;
}

const DEFAULTS = { lang: "en" as Lang, voiceLang: null as Lang | null, saveHistory: false, reduceMotion: false };

/**
 * `skipHydration`: the first client render must match the server render (English), so Providers calls
 * `useSettings.persist.rehydrate()` after mount.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLang: (lang) => set({ lang }),
      setVoiceLang: (voiceLang) => set({ voiceLang }),
      setSaveHistory: (saveHistory) => set({ saveHistory }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "cryptiq.settings",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lang: s.lang, voiceLang: s.voiceLang, saveHistory: s.saveHistory, reduceMotion: s.reduceMotion }),
    },
  ),
);

/** The language used for speech input/output. */
export const selectVoiceLang = (s: SettingsState): Lang => s.voiceLang ?? s.lang;

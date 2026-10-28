"use client";

import { create } from "zustand";

export interface UiState {
  creditsOpen: boolean;
  dockOpen: boolean;
  openCredits: () => void;
  closeCredits: () => void;
  setDockOpen: (open: boolean) => void;
}

/** Cross-component UI switches (the credit pill opens the drawer; 402 errors open it too). */
export const useUi = create<UiState>()((set) => ({
  creditsOpen: false,
  dockOpen: false,
  openCredits: () => set({ creditsOpen: true }),
  closeCredits: () => set({ creditsOpen: false }),
  setDockOpen: (dockOpen) => set({ dockOpen }),
}));

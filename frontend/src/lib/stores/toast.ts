"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "warning" | "error";
export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

export interface ToastState {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind, ms?: number) => string;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, kind = "info", ms = 4000) => {
    const id = Math.random().toString(36).slice(2, 10);
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }].slice(-4) }));
    if (ms > 0 && typeof window !== "undefined") window.setTimeout(() => get().dismiss(id), ms);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Shortcut usable outside React: `toast("1 credit used", "success")`. */
export const toast = (message: string, kind: ToastKind = "info") => useToast.getState().push(message, kind);

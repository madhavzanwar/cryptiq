import { useSyncExternalStore, type ReactNode } from "react";

/**
 * Tiny registry connecting lightweight placeholders (WalletSlot, rendered anywhere in the app) with the single
 * lazily loaded wallet host (WalletHost). The host renders every slot's content through a portal, so all wallet
 * UI shares ONE WagmiProvider / RainbowKitProvider tree while the app tree itself never remounts.
 */
export interface WalletSlotEntry {
  id: string;
  node: HTMLElement;
  content: ReactNode;
}

const EMPTY: WalletSlotEntry[] = [];
let slots: WalletSlotEntry[] = EMPTY;
let hostReady = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const walletSlots = {
  set(entry: WalletSlotEntry) {
    slots = [...slots.filter((s) => s.id !== entry.id), entry];
    emit();
  },
  remove(id: string) {
    if (!slots.some((s) => s.id === id)) return;
    slots = slots.filter((s) => s.id !== id);
    emit();
  },
  setHostReady(ready: boolean) {
    if (hostReady === ready) return;
    hostReady = ready;
    emit();
  },
};

export const useWalletSlots = (): WalletSlotEntry[] =>
  useSyncExternalStore(
    subscribe,
    () => slots,
    () => EMPTY,
  );
export const useWalletHostReady = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => hostReady,
    () => false,
  );

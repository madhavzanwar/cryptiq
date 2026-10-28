"use client";

import { useWalletHostReady, walletSlots } from "@/lib/web3Slots";
import { useEffect, useId, useState, type ReactNode } from "react";

/**
 * Placeholder for wallet UI. Until the wallet host has loaded it shows `fallback`; afterwards the host renders
 * `children` into this spot through a portal (so hooks inside see the shared wagmi/RainbowKit context).
 */
export function WalletSlot({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const id = useId();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const ready = useWalletHostReady();

  useEffect(() => {
    if (node) walletSlots.set({ id, node, content: children });
  });
  useEffect(() => () => walletSlots.remove(id), [id]);

  return (
    <div ref={setNode} className="contents">
      {!ready && fallback}
    </div>
  );
}

"use client";

import { useWalletSlots, walletSlots } from "@/lib/web3Slots";
import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import Web3Scope from "./Web3Scope";

/**
 * Subscribes to the slot registry. Kept separate from the providers on purpose: wagmi's <Hydrate> runs its mount
 * logic on every render of WagmiProvider, so the provider tree must render ONCE and only this child may re-render.
 */
function Portals() {
  const slots = useWalletSlots();
  return <>{slots.map((s) => createPortal(s.content, s.node, s.id))}</>;
}

/** The one wagmi + RainbowKit tree of the app. Loaded lazily by Web3Provider; renders each WalletSlot via a portal. */
function WalletHost() {
  useEffect(() => {
    walletSlots.setHostReady(true);
    return () => walletSlots.setHostReady(false);
  }, []);
  return (
    <Web3Scope>
      <Portals />
    </Web3Scope>
  );
}

export default memo(WalletHost);

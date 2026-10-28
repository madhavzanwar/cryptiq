"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

// The wallet host (wagmi + RainbowKit + WalletConnect) is a client-only chunk, loaded once the browser is idle.
const WalletHost = dynamic(() => import("./WalletHost"), { ssr: false });

/**
 * Mounted by Providers inside the QueryClientProvider (wagmi needs that query client above it).
 * Server HTML and the first paint contain none of the wallet code: children render as-is, and after hydration
 * (when the browser is idle) ONE lazy host mounts next to them. Wallet UI (ConnectWalletButton, AttestPanel) is
 * rendered into that host through WalletSlot portals, so there is a single provider tree, no remounting of the
 * app, and no hydration mismatch.
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const ric = window.requestIdleCallback as
      ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (ric) {
      const id = ric(() => setLoad(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setLoad(true), 400);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      {children}
      {load && <WalletHost />}
    </>
  );
}

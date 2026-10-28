"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getWagmiConfig, CHAIN } from "@/lib/web3Config";
import { lightTheme, RainbowKitProvider, type Theme } from "@rainbow-me/rainbowkit";
import { memo, useMemo, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

/** Wallet theme matching DESIGN.md: Carbon accent, flat (no shadows), 1px Carbon modal border. Values come from the tokens. */
function useWalletTheme(): Theme {
  return useMemo(() => {
    const root = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
    const base = lightTheme({
      accentColor: v("--color-carbon", "black"),
      accentColorForeground: v("--color-pure-white", "white"),
      borderRadius: "large",
      fontStack: "system",
      overlayBlur: "none",
    });
    return {
      ...base,
      colors: {
        ...base.colors,
        modalBorder: v("--color-carbon", "black"),
        modalBackdrop: v("--scrim", "rgba(0,0,0,0.4)"),
        generalBorder: v("--color-ash-gray", "gray"),
      },
      shadows: {
        ...base.shadows,
        connectButton: "none",
        dialog: "none",
        profileDetailsAction: "none",
        selectedOption: "none",
        selectedWallet: "none",
        walletLogo: "none",
      },
    };
  }, []);
}

/**
 * Wagmi + RainbowKit around ONE subtree (the connect button, the attestation panel). Loaded lazily and
 * only on the client, so wallet code never touches server rendering or the first paint. All scopes share
 * the same wagmi config object, so a connection made in one is visible in the others.
 */
function Web3Scope({ children }: { children: ReactNode }) {
  const theme = useWalletTheme();
  return (
    <WagmiProvider config={getWagmiConfig()}>
      <RainbowKitProvider theme={theme} modalSize="compact" initialChain={CHAIN}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default memo(Web3Scope);

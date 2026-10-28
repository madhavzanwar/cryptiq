import { WALLETCONNECT_PROJECT_ID } from "@/lib/env";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, type Config } from "wagmi";
import { baseSepolia } from "wagmi/chains";

/**
 * Wagmi config for Base Sepolia ONLY (chainId 84532, a test network: no real money).
 * Heavy: import it only from the lazily loaded web3 chunk (Web3Scope), never from the main bundle.
 */
export const CHAIN = baseSepolia;

const FALLBACK_PROJECT_ID = "b8f6819204c5d88f91839e5238ef2274";
export const HAS_WALLETCONNECT = Boolean(WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID);

let cached: Config | undefined;

export function getWagmiConfig(): Config {
  if (cached) return cached;
  const transports = { [baseSepolia.id]: http() };
  const projectId = WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID;

  cached = getDefaultConfig({
    appName: "Cryptiq",
    projectId,
    chains: [baseSepolia],
    transports,
    ssr: false,
  });

  return cached;
}

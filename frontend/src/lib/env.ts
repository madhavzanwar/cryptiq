/** Public (browser-visible) configuration. Names only come from frontend/.env.example. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
/** "" = same origin; Next.js rewrites /api/* to BACKEND_URL (see next.config.ts). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
/** "browser" forces the Web Speech API instead of POST /api/transcribe. */
export const VOICE_MODE: "auto" | "browser" = process.env.NEXT_PUBLIC_VOICE_MODE === "browser" ? "browser" : "auto";
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
export const EAS_SCHEMA_UID = process.env.NEXT_PUBLIC_EAS_SCHEMA_UID ?? "";
/** EAS contract on Base Sepolia (OP-stack predeploy). */
export const EAS_CONTRACT = process.env.NEXT_PUBLIC_EAS_CONTRACT ?? "0x4200000000000000000000000000000000000021";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
export const DODO_TEST_HINT = process.env.NEXT_PUBLIC_DODO_TEST_HINT ?? "";
export const EASSCAN_URL = "https://base-sepolia.easscan.org";
export const GITHUB_URL = "https://github.com/madhavzanwar/cryptiq";

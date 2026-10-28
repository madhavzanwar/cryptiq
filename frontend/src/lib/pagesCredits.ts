/**
 * Open-source parts and references shown on /about#credits. Keep in sync with docs/CREDITS.md
 * (backend and data rows) plus the frontend libraries actually installed (licences read from each
 * package's package.json). References marked "idea only" were studied for patterns; no code copied.
 */
export interface CreditRow {
  component: string;
  link: string;
  licence: string;
  usedFor: string;
  area: "data" | "backend" | "frontend" | "reference";
}

export const CREDIT_ROWS: CreditRow[] = [
  { area: "data", component: "Elliptic++ dataset (Elmougy & Liu, KDD 2023)", link: "https://github.com/git-disl/EllipticPlusPlus", licence: "No licence stated (research dataset, never committed)", usedFor: "Wallet labels, features and transfers behind every check" },
  { area: "data", component: "OFAC sanctioned digital currency addresses (0xB10C)", link: "https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses", licence: "MIT", usedFor: "Sanctions list match on a wallet" },
  { area: "backend", component: "BIP-39 word list, BIP-173/350 bech32 checks", link: "https://github.com/bitcoin/bips", licence: "MIT / BSD-2-Clause", usedFor: "Seed-phrase detection and address checksums" },
  { area: "backend", component: "Sarvam AI cookbook", link: "https://github.com/sarvamai/sarvam-ai-cookbook", licence: "Apache-2.0", usedFor: "Speech request shapes (read only, not a dependency)" },
  { area: "backend", component: "Dodo Payments Python SDK", link: "https://github.com/dodopayments/dodopayments-python", licence: "Apache-2.0", usedFor: "Checkout request shapes (read only; BillingSDK GPL-3.0 not used)" },
  { area: "backend", component: "Standard Webhooks", link: "https://github.com/standard-webhooks/standard-webhooks", licence: "MIT", usedFor: "Webhook signature test vector" },
  { area: "backend", component: "FastAPI, XGBoost, NetworkX, pyTigerGraph and other Python libraries", link: "https://github.com/madhavzanwar/cryptiq/blob/main/docs/CREDITS.md", licence: "MIT, BSD, Apache-2.0, MPL-2.0", usedFor: "API, model and graph engines" },
  { area: "backend", component: "TigerGraph Savanna (service)", link: "https://www.tigergraph.com", licence: "Commercial service, free tier", usedFor: "Graph database for wallet topology" },
  { area: "frontend", component: "Next.js and React", link: "https://github.com/vercel/next.js", licence: "MIT", usedFor: "The web app" },
  { area: "frontend", component: "Tailwind CSS", link: "https://github.com/tailwindlabs/tailwindcss", licence: "MIT", usedFor: "Styling from the design tokens" },
  { area: "frontend", component: "TanStack Query, Zustand, Zod", link: "https://github.com/TanStack/query", licence: "MIT", usedFor: "Data fetching, small state stores, response validation" },
  { area: "frontend", component: "Motion (framer-motion)", link: "https://github.com/motiondivision/motion", licence: "MIT", usedFor: "Animations" },
  { area: "frontend", component: "react-force-graph", link: "https://github.com/vasturiano/react-force-graph", licence: "MIT", usedFor: "Evidence graph" },
  { area: "frontend", component: "RainbowKit, wagmi, viem", link: "https://github.com/rainbow-me/rainbowkit", licence: "MIT", usedFor: "Wallet connection on Base Sepolia" },
  { area: "frontend", component: "Ethereum Attestation Service SDK", link: "https://github.com/ethereum-attestation-service/eas-sdk", licence: "MIT", usedFor: "On-chain attestations (test network)" },
  { area: "frontend", component: "ethers", link: "https://github.com/ethers-io/ethers.js", licence: "MIT", usedFor: "Hashing and encoding" },
  { area: "frontend", component: "qrcode.react", link: "https://github.com/zpao/qrcode.react", licence: "ISC", usedFor: "Payment QR codes" },
  { area: "frontend", component: "lucide-react", link: "https://github.com/lucide-icons/lucide", licence: "ISC", usedFor: "Icons" },
  { area: "frontend", component: "Inter Tight, IBM Plex Mono, Noto Sans Devanagari", link: "https://fonts.google.com", licence: "SIL Open Font Licence 1.1", usedFor: "Typefaces" },
  { area: "reference", component: "ETHGlobal showcase projects (EthFlow, AegisPay, Trust Explorer, Sentinel Protocol, VoiceDoc, Rug Pull Detection, Sybil Slayer)", link: "https://ethglobal.com/showcase", licence: "Not checked: ideas only, no code copied", usedFor: "Patterns for graph view, verdict card, attestation flow, progress steps and voice button" },
];

export type CreditArea = CreditRow["area"];
export const CREDIT_AREAS: CreditArea[] = ["data", "backend", "frontend", "reference"];

/** Placeholder team (edit the names and roles). */
export const TEAM: { name: string; role: string }[] = [
  { name: "Frontend teammate", role: "Next.js app, design and motion" },
  { name: "Backend teammate", role: "API, data pipeline, graph and model" },
];

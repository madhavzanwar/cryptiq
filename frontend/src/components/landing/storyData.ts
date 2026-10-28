import type { MessageKey } from "@/lib/i18n";

export type StickerTone = "y" | "pk" | "bl" | "al" | "bk" | "wn";

export interface Sticker {
  id: string;
  tone: StickerTone;
  /** em, relative to the device font size. */
  w: number;
  h: number;
  rad: string;
  /** Rest position as a fraction of the device width/height from its centre. */
  fx: number;
  fy: number;
  r: number;
  text?: MessageKey;
  /** SVG path data (24x24 viewBox, stroked). */
  icon?: string;
  coin?: boolean;
}

/** The ten confetti stickers that collapse into the logo and burst back out (MOTION.md). */
export const STICKERS: Sticker[] = [
  { id: "hindi", tone: "y", w: 5.6, h: 3.7, rad: ".5em", fx: -0.27, fy: -0.28, r: -10, text: "story.stk.hindi" },
  { id: "shield", tone: "pk", w: 3.8, h: 3.8, rad: "50%", fx: 0.07, fy: -0.23, r: 0, icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" },
  { id: "arrow", tone: "bl", w: 2.6, h: 2.6, rad: "50%", fx: 0.37, fy: -0.31, r: 0, icon: "M7 17L17 7M9 7h8v8" },
  { id: "know", tone: "al", w: 9.6, h: 2.7, rad: "99px", fx: 0.24, fy: 0.3, r: -32, text: "story.stk.know" },
  { id: "coinY", tone: "y", w: 3.9, h: 3.9, rad: "50%", fx: -0.37, fy: 0.05, r: 0, coin: true },
  { id: "block", tone: "bk", w: 4.8, h: 2.2, rad: "99px", fx: 0.07, fy: 0.37, r: -8, text: "verdict.block" },
  { id: "warn", tone: "wn", w: 4.4, h: 2.2, rad: "99px", fx: 0.34, fy: 0.07, r: 14, text: "verdict.warn" },
  { id: "allow", tone: "al", w: 4.8, h: 2.2, rad: "99px", fx: -0.25, fy: 0.3, r: 12, text: "verdict.allow" },
  { id: "ms", tone: "bl", w: 4.4, h: 2.2, rad: "99px", fx: -0.3, fy: -0.1, r: -6, text: "story.stk.ms" },
  { id: "coinP", tone: "pk", w: 2.6, h: 2.6, rad: "50%", fx: 0.3, fy: -0.14, r: 0, coin: true },
];

export type WalletVerdict = "ALLOW" | "BLOCK" | "WARN" | "UNKNOWN";

/** 15 clearly fake demo wallets for the rolling list (never real addresses). */
const KINDS: [string, WalletVerdict][] = [
  ["LICIT", "ALLOW"],
  ["ILLICIT", "BLOCK"],
  ["BORDERLINE", "WARN"],
  ["NOTFOUND", "UNKNOWN"],
];
export const WHEEL_ROWS: { name: string; verdict: WalletVerdict }[] = Array.from({ length: 15 }, (_, i) => {
  const [kind, verdict] = KINDS[(i * 3 + (i > 7 ? 1 : 0)) % 4] as [string, WalletVerdict];
  return { name: `DEMO-${kind}-${String(i + 1).padStart(2, "0")}`, verdict };
});

export const TYPED_ADDRESS = "DEMO-ILLICIT-01";

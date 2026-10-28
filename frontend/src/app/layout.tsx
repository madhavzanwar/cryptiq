import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter_Tight, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

// Inter Tight is the single typeface (weights 500/600 only). Plex Mono is for addresses/hashes/code;
// Noto Sans Devanagari carries Hindi. See DESIGN.md.
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-inter-tight", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: "500", variable: "--font-ibm-plex-mono", display: "swap" });
const notoDevanagari = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], weight: ["500", "600"], variable: "--font-noto-devanagari", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Cryptiq", template: "%s | Cryptiq" },
  description: "Say a wallet. Get ALLOW, WARN or BLOCK. See why on a graph. Keep proof on-chain. A risk signal, not an accusation.",
  icons: { icon: "/brand/logo-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#f9faf9", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${interTight.variable} ${plexMono.variable} ${notoDevanagari.variable}`}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

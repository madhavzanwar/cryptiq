"use client";

import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { cn } from "@/lib/cn";
import { useCreditsQuery } from "@/lib/hooks/useApi";
import { useT } from "@/lib/i18n/provider";
import { useSyncExternalStore } from "react";
import { CreditPill } from "./CreditPill";
import { LangToggle } from "./LangToggle";
import { Logo } from "./Logo";
import { OverflowMenu } from "./OverflowMenu";

/** True once the landing story has scrolled away (or when there is no story on the page). */
function storyScrolledAway(): boolean {
  const story = document.getElementById("story");
  if (!story) return true;
  // The static (reduced-motion) layout scrolls like a normal page, so the bar is always solid there.
  if (story.hasAttribute("data-static") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return story.getBoundingClientRect().bottom <= 70;
}

function subscribeScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/**
 * Top bar: logo mark (left); language toggle, credit pill, connect wallet and the overflow menu (right).
 * On the landing page it floats transparently over the pinned scroll story and becomes solid once the story
 * has scrolled away. On every other page it is a sticky solid bar.
 */
export function TopBar({ overlay = false }: { overlay?: boolean }) {
  const { t } = useT();
  useCreditsQuery(); // loads the balance into the store the credit pill reads
  const scrolledAway = useSyncExternalStore(subscribeScroll, storyScrolledAway, () => false);
  const solid = !overlay || scrolledAway;

  return (
    <header
      data-solid={solid ? "" : undefined}
      className={cn(
        "top-0 z-40 h-[70px] w-full transition-colors duration-200 ease-out",
        overlay ? "fixed" : "sticky",
        solid ? "border-b border-carbon bg-paper-white" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-full items-center gap-[18px]">
        <Logo alt={t("layout.logo.alt")} />
        <div className="ml-auto flex items-center gap-[9px]">
          <LangToggle />
          <CreditPill />
          <div className="hidden sm:block">
            <ConnectWalletButton />
          </div>
          <OverflowMenu />
        </div>
      </div>
    </header>
  );
}

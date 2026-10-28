"use client";

import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { cn } from "@/lib/cn";
import { GITHUB_URL } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { ExternalLink, History, MonitorPlay, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Compact "more" menu in the top bar: History, Settings, Stage mode, GitHub. */
export function OverflowMenu() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const item = "flex min-h-11 items-center gap-[13px] rounded-nav px-[13px] text-body-lg transition-colors duration-[120ms] ease-out hover:bg-pure-white";
  const close = () => setOpen(false);
  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("layout.more")}
        onClick={() => setOpen((o) => !o)}
        className={cn("inline-flex size-11 items-center justify-center rounded-button border border-carbon bg-pure-white transition-colors duration-[120ms] ease-out hover:bg-bone", open && "bg-bone")}
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>
      {open && (
        <ul role="menu" className="absolute top-[calc(100%+9px)] right-0 z-50 grid min-w-[220px] gap-1 rounded-card border border-carbon bg-bone p-[9px] animate-[toast-in_200ms_var(--ease-emphasized)_both]">
          <li role="none">
            <Link role="menuitem" href="/history" onClick={close} className={item}>
              <History className="size-5" aria-hidden strokeWidth={1.75} />
              {t("nav.history")}
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href="/settings" onClick={close} className={item}>
              <Settings className="size-5" aria-hidden strokeWidth={1.75} />
              {t("layout.settings")}
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href="/demo" onClick={close} className={item}>
              <MonitorPlay className="size-5" aria-hidden strokeWidth={1.75} />
              {t("layout.stage")}
            </Link>
          </li>
          <li role="none" className="p-[4px] sm:hidden">
            <ConnectWalletButton />
          </li>
          <li role="none">
            <a role="menuitem" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" onClick={close} className={item}>
              <ExternalLink className="size-5" aria-hidden strokeWidth={1.75} />
              {t("layout.github")}
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

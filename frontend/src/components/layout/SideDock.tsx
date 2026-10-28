"use client";

import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { useUi } from "@/lib/stores/ui";
import { ChartColumn, Coins, Info, Mic } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { classes } from "@/lib/motion/classes";
import "./SideDock.css";

const styles = classes("sd");

const ITEMS: { href: string; key: MessageKey; Icon: typeof Mic }[] = [
  { href: "/check", key: "nav.check", Icon: Mic },
  { href: "/benchmark", key: "nav.benchmark", Icon: ChartColumn },
  { href: "/credits", key: "nav.credits", Icon: Coins },
  { href: "/about", key: "nav.about", Icon: Info },
];

const isCurrent = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Collapsed navigation on the left edge. The launcher (bitcoin glyph, quarter-turn into a cross) opens a
 * vertical menu with Check, Benchmark, Credits and About. Esc, an outside click or choosing an item closes it;
 * ArrowUp/Down/Home/End move between items.
 */
export function SideDock() {
  const { t } = useT();
  const pathname = usePathname();
  const open = useUi((s) => s.dockOpen);
  const setOpen = useUi((s) => s.setDockOpen);
  const dock = useRef<HTMLElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const focusFirst = useRef(false);

  const links = (): HTMLAnchorElement[] => [...(menu.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) launch.current?.focus();
  };

  // close after navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // move focus into the menu when opened from the keyboard
  useEffect(() => {
    if (open && focusFirst.current) {
      focusFirst.current = false;
      links()[0]?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e: PointerEvent) => {
      if (dock.current && !dock.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onLaunchKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      focusFirst.current = true;
      setOpen(true);
    }
  };
  const onMenuKey = (e: KeyboardEvent) => {
    const all = links();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    const go = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
  };

  return (
    <nav ref={dock} className={styles.dock} data-open={open ? "" : undefined} aria-label={t("layout.dock.label")}>
      <button
        ref={launch}
        type="button"
        className={styles.launch}
        aria-label={open ? t("nav.menu.close") : t("nav.menu.open")}
        aria-expanded={open}
        aria-controls="dock-menu"
        onClick={() => setOpen(!open)}
        onKeyDown={onLaunchKey}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <g className={styles.btc}>
            <path d="M8 5.5h5.2a2.75 2.75 0 0 1 0 5.5H8m0 0h5.8a2.75 2.75 0 0 1 0 5.5H8M8 5.5v11M10.5 3.5v2M13.5 3.5v2M10.5 16.5v2M13.5 16.5v2" />
          </g>
          <g className={styles.x}>
            <path d="M6 6l12 12M18 6L6 18" />
          </g>
        </svg>
        <span className={styles.tip}>{t("layout.dock.tip")}</span>
      </button>
      <ul ref={menu} id="dock-menu" className={styles.menu} aria-hidden={!open} inert={!open} onKeyDown={onMenuKey}>
        {ITEMS.map(({ href, key, Icon }, i) => (
          <li key={href} className={styles.item} style={{ "--i": i } as CSSProperties}>
            <Link href={href} className={styles.link} aria-current={isCurrent(pathname, href) ? "page" : undefined} onClick={() => close(true)}>
              <Icon aria-hidden />
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

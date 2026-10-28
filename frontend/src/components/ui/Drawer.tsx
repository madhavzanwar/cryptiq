"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal drawer (right edge, or bottom sheet on phones): scrim at 40%, Pure White surface, 1px Carbon border.
 * Esc and scrim click close it, focus is trapped inside, and focus returns to the opener.
 */
export function Drawer({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const { t } = useT();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const el = panel.current;
    el?.focus();
    const focusables = () => [...(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch" role="presentation">
      <button type="button" aria-label={t("action.close")} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[var(--scrim)]" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[88dvh] w-full flex-col overflow-y-auto rounded-t-card border border-carbon bg-pure-white p-[var(--card-padding)] sm:max-h-none sm:w-[480px] sm:rounded-none sm:rounded-l-card",
          "animate-[drawer-in_320ms_var(--ease-emphasized)_both]",
          className,
        )}
      >
        <div className="mb-[18px] flex items-start justify-between gap-[18px]">
          <h2 className="sub">{title}</h2>
          <button type="button" aria-label={t("action.close")} onClick={onClose} className="inline-flex size-11 flex-none items-center justify-center rounded-button hover:bg-bone">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import type { NodeLabel } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";

/** Same shapes as the canvas: illicit diamond, licit disc, unknown ring. Colour is never the only cue. */
export function ShapeIcon({ label, className }: { label: NodeLabel | "subject"; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 flex-none", className)} aria-hidden>
      {label === "subject" && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-none stroke-carbon" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="4.6" className="fill-obsidian" />
          <circle cx="8" cy="8" r="1.8" className="fill-sticker-yellow" />
        </>
      )}
      {label === "illicit" && <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" className="fill-block" />}
      {label === "licit" && <circle cx="8" cy="8" r="5.5" className="fill-allow" />}
      {label === "unknown" && (
        <circle cx="8" cy="8" r="5" className="fill-paper-white stroke-unknown" strokeWidth="2" />
      )}
    </svg>
  );
}

export function GraphLegend() {
  const { t } = useT();
  const items = [
    { label: "subject" as const, text: t("graph.legend.subject") },
    { label: "illicit" as const, text: t("graph.legend.illicit") },
    { label: "licit" as const, text: t("graph.legend.licit") },
    { label: "unknown" as const, text: t("graph.legend.unknown") },
  ];
  return (
    <ul
      aria-label={t("graph.legend.title")}
      className="flex flex-wrap items-center gap-x-[18px] gap-y-[7px] text-small"
    >
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-[7px]">
          <ShapeIcon label={i.label} />
          {i.text}
        </li>
      ))}
      <li className="inline-flex items-center gap-[7px]">
        <svg viewBox="0 0 24 16" className="h-4 w-6 flex-none" aria-hidden>
          <path d="M1 8h17" className="stroke-slate-gray" strokeWidth="1.5" />
          <path d="M16 3.5 22 8l-6 4.5Z" className="fill-slate-gray" />
        </svg>
        {t("graph.legend.arrow")}
      </li>
    </ul>
  );
}

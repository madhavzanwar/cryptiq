"use client";

import { cn } from "@/lib/cn";
import { useId, useState, type ReactNode } from "react";

/** FAQ row: Bone background, plus icon that turns into a cross, answer opens by animating grid rows. */
export function AccordionItem({ question, children, lang, defaultOpen = false }: { question: ReactNode; children: ReactNode; lang?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div lang={lang} className="[&+&]:mt-[7px]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-[18px] rounded-card bg-bone p-[26px] text-left text-body-lg transition-colors duration-[120ms] ease-out hover:bg-plaster"
      >
        <span>{question}</span>
        <span aria-hidden className={cn("relative size-[26px] flex-none rounded-full border border-carbon transition-transform duration-200 ease-emphasized", open && "rotate-45")}>
          <span className="absolute top-1/2 left-1/2 h-px w-[10px] -translate-x-1/2 -translate-y-1/2 bg-carbon" />
          <span className="absolute top-1/2 left-1/2 h-[10px] w-px -translate-x-1/2 -translate-y-1/2 bg-carbon" />
        </span>
      </button>
      <div id={id} role="region" className={cn("grid transition-[grid-template-rows] duration-[320ms] ease-emphasized", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="measure px-[26px] pt-[13px] pb-[18px] text-ash-gray">{children}</div>
        </div>
      </div>
    </div>
  );
}

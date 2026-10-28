"use client";

import { cn } from "@/lib/cn";
import { useToast } from "@/lib/stores/toast";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

const ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert } as const;
const BAR = { info: "border-l-carbon", success: "border-l-allow", warning: "border-l-warn", error: "border-l-block" } as const;

/** Bottom-centre toasts (`aria-live="polite"`), 4px left bar in the variant colour. */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[60] flex flex-col items-center gap-[9px] px-[18px]">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-[420px] items-center gap-[11px] rounded-card border border-l-4 border-carbon bg-pure-white py-[11px] pr-[7px] pl-[16px] text-body animate-[toast-in_200ms_var(--ease-emphasized)_both]", BAR[t.kind])}>
            <Icon className="size-5 flex-none" aria-hidden />
            <span className="min-w-0 flex-1">{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="inline-flex size-9 flex-none items-center justify-center rounded-button hover:bg-bone">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}

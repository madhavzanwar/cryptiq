"use client";

import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Copies `value` to the clipboard and shows "Copied" for a moment. */
export function CopyButton({ value, label, className, iconOnly = false }: { value: string; label?: string; className?: string; iconOnly?: boolean }) {
  const { t } = useT();
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const text = label ?? t("action.copy");
  return (
    <button
      type="button"
      aria-label={done ? t("action.copied") : text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className={cn("inline-flex min-h-11 min-w-11 items-center justify-center gap-[7px] rounded-button px-[13px] text-small transition-colors duration-[120ms] ease-out hover:bg-bone", className)}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {!iconOnly && <span aria-live="polite">{done ? t("action.copied") : text}</span>}
    </button>
  );
}

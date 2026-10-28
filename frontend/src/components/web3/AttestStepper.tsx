"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { Check } from "lucide-react";

/**
 * Four numbered steps (Connect wallet -> Switch to Base Sepolia -> Sign -> Done), DESIGN.md "Stepper":
 * 35px circles; done = Carbon + check, current = Sticker Yellow with a Carbon border, upcoming = Plaster.
 * Vertical in narrow containers, horizontal from 540px of container width. `current` is the 0-based index of the step to do next (4 = all done).
 */
export function AttestStepper({ current, className }: { current: number; className?: string }) {
  const { t } = useT();
  const steps = [t("web3.step.connect"), t("web3.step.network"), t("web3.step.sign"), t("web3.step.done")];
  return (
    <div className={cn("@container", className)}>
      <ol
        aria-label={t("web3.steps.aria")}
        className="flex flex-col gap-[13px] @[540px]:flex-row @[540px]:items-center @[540px]:gap-0"
      >
        {steps.map((label, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li
              key={label}
              aria-current={now ? "step" : undefined}
              className="flex items-center gap-[11px] @[540px]:flex-1 @[540px]:last:flex-none"
            >
              <span
                className={cn(
                  "inline-flex size-[35px] flex-none items-center justify-center rounded-tag border text-body font-semibold transition-colors duration-200 ease-out",
                  done && "border-carbon bg-carbon text-pure-white",
                  now && "border-carbon bg-sticker-yellow text-carbon",
                  !done && !now && "border-transparent bg-plaster text-ash-gray",
                )}
              >
                {done ? <Check className="size-4" aria-hidden strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={cn("text-body", done || now ? "text-carbon" : "text-ash-gray")}>{label}</span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-px flex-1 @[540px]:mx-[11px] @[540px]:block",
                    done ? "bg-carbon" : "bg-ash-gray/40",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

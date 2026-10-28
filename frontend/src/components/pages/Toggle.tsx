"use client";

import { cn } from "@/lib/cn";
import { useId, type ReactNode } from "react";

/**
 * Switch (role="switch"): 52 x 28 track, Carbon when on, white thumb. 44px tall hit area.
 * The label is the visible text next to it; `help` is linked as the description.
 */
export function Toggle({ checked, onChange, label, help, className }: { checked: boolean; onChange: (on: boolean) => void; label: ReactNode; help?: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-[18px]", className)}>
      <div className="min-w-0">
        <label id={`${id}-l`} htmlFor={id} className="block cursor-pointer text-body-lg font-semibold">
          {label}
        </label>
        {help && (
          <p id={`${id}-d`} className="measure mt-[4px] text-body text-ash-gray">
            {help}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={help ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className="relative inline-flex min-h-11 min-w-[60px] flex-none items-center justify-center rounded-button"
      >
        <span className={cn("relative h-[28px] w-[52px] rounded-full border border-carbon transition-colors duration-200 ease-emphasized", checked ? "bg-carbon" : "bg-plaster")}>
          <span className={cn("absolute top-[3px] left-[3px] size-5 rounded-full border border-carbon bg-pure-white transition-transform duration-200 ease-emphasized", checked && "translate-x-6")} />
        </span>
      </button>
    </div>
  );
}

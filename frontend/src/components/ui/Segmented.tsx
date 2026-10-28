"use client";

import { cn } from "@/lib/cn";
import { useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Used when `label` is not text, and for the language attribute of a segment. */
  ariaLabel?: string;
  lang?: string;
}

/** Radio-group segmented control (language, hop depth, coin). Arrow keys move between segments. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  className?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex overflow-hidden rounded-input border border-carbon bg-pure-white", className)}>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            lang={o.lang}
            className={cn(
              "relative inline-flex min-h-[42px] min-w-11 cursor-pointer items-center justify-center px-[18px] text-body transition-colors duration-[120ms] ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-carbon",
              checked ? "bg-carbon text-pure-white" : "hover:bg-bone",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} aria-label={o.ariaLabel} className="sr-only" />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

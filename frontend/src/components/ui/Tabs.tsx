"use client";

import { cn } from "@/lib/cn";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  lang?: string;
  panel: ReactNode;
}

/** Accessible tabs (roving tabindex, arrow keys). Uncontrolled unless `value` is given. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<T>[];
  value?: T;
  onChange?: (v: T) => void;
  label: string;
  className?: string;
}) {
  const uid = useId();
  const [inner, setInner] = useState<T>(items[0]!.id);
  const current = value ?? inner;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const select = (id: T) => {
    setInner(id);
    onChange?.(id);
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + dir + items.length) % items.length;
    const it = items[next]!;
    select(it.id);
    refs.current[it.id]?.focus();
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-[26px] border-b border-carbon">
        {items.map((it, i) => {
          const on = it.id === current;
          return (
            <button
              key={it.id}
              ref={(el) => {
                refs.current[it.id] = el;
              }}
              role="tab"
              id={`${uid}-tab-${it.id}`}
              aria-selected={on}
              aria-controls={`${uid}-panel-${it.id}`}
              tabIndex={on ? 0 : -1}
              lang={it.lang}
              onClick={() => select(it.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn("-mb-px inline-flex min-h-11 items-center border-b-2 text-body-lg transition-colors duration-[120ms] ease-out", on ? "border-obsidian text-obsidian" : "border-transparent text-ash-gray hover:text-carbon")}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {items.map((it) => (
        <div key={it.id} role="tabpanel" id={`${uid}-panel-${it.id}`} aria-labelledby={`${uid}-tab-${it.id}`} hidden={it.id !== current} className="pt-[26px]">
          {it.id === current && it.panel}
        </div>
      ))}
    </div>
  );
}

import { cn } from "@/lib/cn";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Graph evidence = Carbon, raw dump = Powder Blue (DESIGN.md). */
  tone: "graph" | "raw";
}

/**
 * One comparison chart as flat horizontal bars with the value written next to each bar.
 * Bars are decoration (aria-hidden); the same numbers are in the table below the charts.
 */
export function CompareBars({ title, hint, data, format }: { title: string; hint: string; data: BarDatum[]; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="rounded-card border border-carbon bg-pure-white p-[var(--card-padding)]">
      <figcaption className="mb-[18px]">
        <span className="sub block">{title}</span>
        <span className="text-small text-ash-gray">{hint}</span>
      </figcaption>
      <ul className="grid gap-[18px]">
        {data.map((d) => (
          <li key={d.key}>
            <div className="mb-[7px] flex items-baseline justify-between gap-[13px] text-body">
              <span>{d.label}</span>
              <strong className="text-body-lg tabular-nums">{format(d.value)}</strong>
            </div>
            <div aria-hidden className="h-[26px] w-full rounded-tag bg-plaster">
              <div
                className={cn("h-full rounded-tag border border-carbon transition-[width] duration-[900ms] ease-emphasized", d.tone === "graph" ? "bg-carbon" : "bg-powder-blue")}
                style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

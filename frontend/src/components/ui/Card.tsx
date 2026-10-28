import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** White card, 1px Carbon border, 17.5px radius, 26px padding. `tint` renders a borderless pastel card. */
export function Card({
  tint,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tint?: "yellow" | "pink" | "blue" | "bone" | "mint" }) {
  const tints = { yellow: "bg-sticker-yellow", pink: "bg-cotton-pink", blue: "bg-powder-blue", bone: "bg-bone", mint: "bg-allow-tint" };
  return (
    <div
      {...rest}
      className={cn("rounded-card p-[var(--card-padding)]", tint ? tints[tint] : "border border-carbon bg-pure-white", className)}
    />
  );
}

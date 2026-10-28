import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** Loading placeholder: give it the size of what it stands in for so nothing shifts. */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton", className)} {...rest} />;
}

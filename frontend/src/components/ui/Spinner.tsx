import { cn } from "@/lib/cn";
import { LoaderCircle } from "lucide-react";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn("size-5 animate-spin", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

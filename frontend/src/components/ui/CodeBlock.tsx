import { cn } from "@/lib/cn";
import { CopyButton } from "./CopyButton";

/** Plaster block with Plex Mono text and a copy button. For GSQL, JSON, payment URIs. */
export function CodeBlock({ code, className, label }: { code: string; className?: string; label?: string }) {
  return (
    <div className={cn("relative rounded-card border border-carbon bg-plaster", className)}>
      <pre tabIndex={0} aria-label={label} className="overflow-x-auto p-[18px] pr-[88px] font-mono text-small leading-[1.5] font-medium whitespace-pre">
        {code}
      </pre>
      <CopyButton value={code} iconOnly className="absolute top-[7px] right-[7px]" />
    </div>
  );
}

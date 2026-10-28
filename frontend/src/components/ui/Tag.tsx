import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type TagTone = "bone" | "white" | "outline" | "yellow" | "pink" | "blue" | "allow" | "warn" | "block" | "unknown" | "carbon";

const tones: Record<TagTone, string> = {
  bone: "bg-bone text-carbon",
  white: "bg-pure-white text-carbon",
  outline: "border border-carbon bg-pure-white text-carbon",
  yellow: "bg-sticker-yellow text-carbon",
  pink: "bg-cotton-pink text-carbon",
  blue: "bg-powder-blue text-carbon",
  allow: "bg-allow-tint text-allow-ink",
  warn: "bg-warn-tint text-warn-ink",
  block: "bg-block-tint text-block-ink",
  unknown: "bg-unknown-tint text-unknown-ink",
  carbon: "bg-carbon text-pure-white",
};

/** 14px-radius chip. Verdict tones always go with an icon and a word at the call site. */
export function Tag({ tone = "bone", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      {...rest}
      className={cn("inline-flex items-center gap-[7px] rounded-tag px-[13px] py-[7px] text-small leading-[1.2] font-medium", tones[tone], className)}
    />
  );
}

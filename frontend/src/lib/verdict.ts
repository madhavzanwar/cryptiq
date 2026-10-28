import type { Verdict } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n";

/** Everything the UI needs to render a verdict: always an icon + a word + a tint, never colour alone. */
export interface VerdictMeta {
  word: MessageKey;
  line: MessageKey;
  icon: "check-circle" | "alert-triangle" | "shield-x" | "help-circle";
  /** Tailwind classes for the tinted chip (background + ink). */
  chip: string;
  /** Solid colour utilities for meter fills, graph marks and bars. */
  solid: string;
  bar: string;
  text: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  ALLOW: {
    word: "verdict.allow",
    line: "verdict.allow.line",
    icon: "check-circle",
    chip: "bg-allow-tint text-allow-ink",
    solid: "bg-allow",
    bar: "border-allow",
    text: "text-allow-ink",
  },
  WARN: {
    word: "verdict.warn",
    line: "verdict.warn.line",
    icon: "alert-triangle",
    chip: "bg-warn-tint text-warn-ink",
    solid: "bg-warn",
    bar: "border-warn",
    text: "text-warn-ink",
  },
  BLOCK: {
    word: "verdict.block",
    line: "verdict.block.line",
    icon: "shield-x",
    chip: "bg-block-tint text-block-ink",
    solid: "bg-block",
    bar: "border-block",
    text: "text-block-ink",
  },
  UNKNOWN: {
    word: "verdict.unknown",
    line: "verdict.unknown.line",
    icon: "help-circle",
    chip: "bg-unknown-tint text-unknown-ink",
    solid: "bg-unknown",
    bar: "border-unknown",
    text: "text-unknown-ink",
  },
};

/** Thresholds from the verdict policy (placeholders tuned by the backend): ticks on the risk meter. */
export const METER_TICKS = [30, 70] as const;

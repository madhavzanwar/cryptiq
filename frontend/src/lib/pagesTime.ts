import type { Lang } from "@/lib/api/types";

/** Seconds left until `expiresAt` (ISO string). 0 when it has passed or the date is invalid. */
export function secondsLeft(expiresAt: string, now: number = Date.now()): number {
  const end = Date.parse(expiresAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - now) / 1000));
}

/** 754 -> "12:34"; hours are folded into minutes (invoices last minutes, not hours). */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Local date and time in the reader's language. Falls back to the raw text if it is not a date. */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { timeStyle: "short" }).format(d);
}

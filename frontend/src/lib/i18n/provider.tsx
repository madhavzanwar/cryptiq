"use client";

import type { Lang } from "@/lib/api";
import { useSettings } from "@/lib/stores/settings";
import { useCallback, useEffect } from "react";
import { translate, type MessageKey, type Vars } from "./index";

export type T = (key: MessageKey, vars?: Vars) => string;

/** `const { t, lang } = useT();` then `t("check.title")` or `t("credits.aria", { n: 3 })`. */
export function useT(): { t: T; lang: Lang } {
  const lang = useSettings((s) => s.lang);
  const t = useCallback<T>((key, vars) => translate(lang, key, vars), [lang]);
  return { t, lang };
}

/** Keeps <html lang> in step with the chosen language (drives the Devanagari font and line-height). */
export function LangSync() {
  const lang = useSettings((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

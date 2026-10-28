import type { Lang } from "@/lib/api";
import { check } from "./messages/check";
import { common } from "./messages/common";
import { graph } from "./messages/graph";
import { landing } from "./messages/landing";
import { layout } from "./messages/layout";
import { pages } from "./messages/pages";
import { web3 } from "./messages/web3";

type EnAll = typeof common.en &
  typeof layout.en &
  typeof landing.en &
  typeof check.en &
  typeof graph.en &
  typeof web3.en &
  typeof pages.en;

export type MessageKey = keyof EnAll;

const namespaces = [common, layout, landing, check, graph, web3, pages] as const;

export const messages: Record<Lang, Record<MessageKey, string>> = {
  en: Object.assign({}, ...namespaces.map((n) => n.en)) as Record<MessageKey, string>,
  hi: Object.assign({}, ...namespaces.map((n) => n.hi)) as Record<MessageKey, string>,
};

export type Vars = Record<string, string | number>;

/** Looks a key up and fills `{name}` placeholders. Falls back to English, then to the key itself. */
export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const raw = messages[lang][key] ?? messages.en[key] ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : raw;
}

export { defineMessages } from "./define";

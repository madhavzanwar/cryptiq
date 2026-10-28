export type Dict = Record<string, string>;

/**
 * Declares one namespace of messages. The Hindi object must have exactly the same keys as the English one
 * (TypeScript enforces it). Keys are flat dotted strings, e.g. "check.title". Placeholders look like `{n}`.
 * Hindi text is written in simple words and should be reviewed by a native speaker.
 */
export function defineMessages<const E extends Dict>(en: E, hi: Record<keyof E, string>) {
  return { en, hi } as { en: E; hi: Record<keyof E, string> };
}

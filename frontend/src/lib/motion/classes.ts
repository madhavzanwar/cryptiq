/**
 * Maps `styles.foo` to the prefixed global class `<prefix>-foo`. The story and dock stylesheets are plain
 * global CSS with a prefix (not CSS Modules) because the project's Turbopack rule sends every `*.css`
 * through the Tailwind loader, which does not hash module class names.
 */
export function classes(prefix: string): Record<string, string> {
  return new Proxy({} as Record<string, string>, { get: (_t, key) => (typeof key === "string" ? `${prefix}-${key}` : undefined) });
}

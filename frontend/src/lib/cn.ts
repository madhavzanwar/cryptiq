import clsx, { type ClassValue } from "clsx";

/** Class-name helper. Tailwind classes here are written once per element, so no merge step is needed. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

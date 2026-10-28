import { expect, type Page } from "@playwright/test";

/** Collects console errors and page errors so every test can assert there were none. */
export function watchErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Expected noise in a sandbox: the public Base RPC and aborted requests.
    if (/Failed to load resource|net::ERR|base\.org|sepolia\.base|AbortError|aborted/i.test(text)) return;
    errors.push(`console.error: ${text}`);
  });
  return () => errors;
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1);
}

export const creditPill = (page: Page) => page.getByRole("button", { name: /credits? left|^credits$/i }).first();

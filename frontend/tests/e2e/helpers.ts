import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/** True when the suite runs against the built-in mock backend (E2E_MOCKS=1) instead of the real fixture backend. */
export const MOCKS = process.env.E2E_MOCKS === "1";

/** Put at the top of a spec that needs the real FastAPI fixture backend (skipped in mock mode). */
export const needsRealBackend = () => test.skip(MOCKS, "needs the real fixture backend (run without E2E_MOCKS)");
/** Put at the top of a spec that only makes sense with the mock backend. */
export const needsMocks = () => test.skip(!MOCKS, "mock-backend scenario (run with E2E_MOCKS=1)");

/**
 * Wallets of the synthetic fixture are `DEMO-w00000` … `DEMO-w02399`. The backend keeps a process-wide 10-minute cache per
 * address, so every test takes wallets from its OWN range and never reuses one: an accidental cache hit would make
 * "the credit meter dropped" assertions lie. Ranges: credits 100s, guards 200s, voice 300s, a11y 400s, mobile 500s.
 */
export const wallet = (n: number) => `DEMO-w${String(n).padStart(5, "0")}`;

/** Collects console and page errors so a test can assert there were none. */
export function watchErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Browser logs for responses the test provokes on purpose (4xx/5xx) and public RPC lookups in a sandbox.
    if (/Failed to load resource|net::ERR|base\.org|sepolia\.base|AbortError|aborted/i.test(text)) return;
    errors.push(`console.error: ${text}`);
  });
  return () => errors;
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1);
}

export const creditPill = (page: Page) => page.getByRole("button", { name: /credits? left|^credits$|क्रेडिट/i }).first();

/** The number in the top-bar credit pill ("3 credits left"). Waits until the balance has loaded. */
export async function creditsLeft(page: Page): Promise<number> {
  await expect(creditPill(page)).toHaveAccessibleName(/\d/);
  const name = (await creditPill(page).getAttribute("aria-label")) ?? "";
  return Number(/(\d+)/.exec(name)?.[1]);
}

/** A brand-new backend session (3 credits): drop the session cookie, then open the page. */
export async function freshSession(context: BrowserContext, page: Page, path = "/check") {
  await context.clearCookies();
  await page.goto(path);
  await expect(creditPill(page)).toHaveAccessibleName(/\b3\b/);
}

export const addressField = (page: Page) => page.getByRole("textbox", { name: /wallet address|वॉलेट/i });

/** Types an address and presses "Check wallet (1 credit)". Does not wait for the result. */
export async function startCheck(page: Page, address: string) {
  await addressField(page).fill(address);
  await page.getByRole("button", { name: /check wallet/i }).click();
}

/** Starts a check and waits for the verdict word (the badge, exact text) to appear. */
export async function runCheck(page: Page, address: string, verdict: "ALLOW" | "WARN" | "BLOCK" | "UNKNOWN") {
  await startCheck(page, address);
  await expect(verdictBadge(page, verdict)).toBeVisible({ timeout: 30_000 });
}

/** The verdict chip: icon + word. (The demo chips read "BLOCK · DEMO-…", so exact matching picks the badge.) */
export const verdictBadge = (page: Page, verdict: string) => page.getByText(verdict, { exact: true }).first();

/** Requests of the page that match a pattern; use to prove that NOTHING was sent. */
export function recordRequests(page: Page, pattern: RegExp): () => string[] {
  const seen: string[] = [];
  page.on("request", (r) => {
    if (pattern.test(r.url())) seen.push(`${r.method()} ${r.url()}`);
  });
  return () => seen;
}

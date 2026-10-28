import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

/**
 * Runs only with E2E_REAL=1: the frontend talks to the REAL FastAPI backend (synthetic fixture) through the
 * Next.js /api rewrite, with the real session cookie, SSE streaming and credit ledger.
 *   cd backend && make fixture && make run-fixture   # then:  E2E_REAL=1 npm run test:e2e
 */
test.skip(process.env.E2E_REAL !== "1", "set E2E_REAL=1 and start the backend on :8000");

test("real backend: demo wallets, streamed check, verdict matches, credit ledger", async ({ page, request }) => {
  const errors = watchErrors(page);
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const wallets = (await (await request.get("/api/demo-wallets")).json()).wallets as { address: string; expected: string }[];
  const block = wallets.find((w) => w.expected === "BLOCK")!;

  await page.goto("/check");
  await expect(page.getByRole("button", { name: /credits left/i }).first()).toHaveAccessibleName(/3 credits left/i);
  await page.getByLabel(/wallet address/i).fill(block.address);
  // the check goes through the streaming endpoint (the fixture engine answers in ms, so progress steps flash by)
  const stream = page.waitForResponse((r) => /\/api\/check\/stream/.test(r.url()));
  await page.getByRole("button", { name: /check wallet/i }).click();
  const res = await stream;
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/event-stream");
  await expect(page.getByText("BLOCK", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  // fixture backend: the answer says so and does not claim TigerGraph
  await expect(page.getByText(/synthetic|mock/i).first()).toBeVisible();
  await expect(page.getByText(/answered by TigerGraph/i)).toHaveCount(0);
  // The backend caches identical checks for 10 minutes and does not charge for them. Either way the ledger must be right.
  const cached = await page.getByText(/cached, no credit used/i).count();
  await expect(page.getByRole("button", { name: /credits left/i }).first()).toHaveAccessibleName(cached > 0 ? /3 credits left/i : /2 credits left/i);
  expect(errors()).toEqual([]);
});

test("real backend: secret input is rejected before it leaves the browser", async ({ page }) => {
  let sent = false;
  page.on("request", (r) => { if (/\/api\/check/.test(r.url())) sent = true; });
  await page.goto("/check");
  await page.getByLabel(/wallet address/i).fill("a".repeat(64));
  await expect(page.getByLabel(/wallet address/i)).toHaveValue("");
  expect(sent).toBe(false);
});

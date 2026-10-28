import { expect, test } from "@playwright/test";
import { creditPill, creditsLeft, freshSession, needsRealBackend, runCheck, startCheck, wallet, watchErrors } from "./helpers";

needsRealBackend();

test("a new check drops the credit meter once, a cached repeat does not, and 0 credits opens the buy flow", async ({ page, context }) => {
  const errors = watchErrors(page);
  await freshSession(context, page);

  // 1) new wallet: 3 -> 2
  await runCheck(page, wallet(100), "ALLOW");
  await expect(creditPill(page)).toHaveAccessibleName(/\b2\b/);

  // 2) the same wallet again: the UI asks first, then the BACKEND answers from its cache: free, labelled, still 2
  await startCheck(page, wallet(100));
  await page.getByRole("button", { name: /check again|फिर से जाँचें/i }).click();
  await expect(page.getByText(/cached, no credit used/i).first()).toBeVisible({ timeout: 30_000 });
  expect(await creditsLeft(page)).toBe(2);

  // 3) two more NEW wallets: 2 -> 1 -> 0
  await runCheck(page, wallet(101), "ALLOW");
  await expect(creditPill(page)).toHaveAccessibleName(/\b1\b/);
  await runCheck(page, wallet(102), "ALLOW");
  await expect(creditPill(page)).toHaveAccessibleName(/\b0\b/);

  // 4) at 0 credits the primary action becomes "Buy credits" and opens the dialog with the packs
  await expect(page.getByRole("button", { name: /check wallet/i })).toHaveCount(0);
  await page.getByRole("button", { name: /buy credits/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/starter/i).first()).toBeVisible(); // the backend's pack list
  await expect(dialog.getByText(/test mode/i).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(errors()).toEqual([]);
});

test("the session cookie lives on the FRONTEND origin (same-origin /api proxy)", async ({ page, context, baseURL }) => {
  await context.clearCookies();
  const apiResponse = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/credits");
  await page.goto("/credits");
  const res = await apiResponse;
  expect(new URL(res.url()).origin).toBe(new URL(baseURL!).origin); // the browser never talks to the backend directly

  const cookie = (await context.cookies(baseURL!)).find((c) => c.name === "cryptiq_sid");
  expect(cookie, "cryptiq_sid cookie").toBeDefined();
  expect(cookie!.httpOnly).toBe(true);
  expect(cookie!.domain.startsWith("."), "host-only cookie (no Domain attribute)").toBe(false);
  expect(cookie!.domain).toBe(new URL(baseURL!).hostname);
  expect(cookie!.value.length).toBeGreaterThan(8);
});

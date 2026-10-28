import { expect, test } from "@playwright/test";
import { addressField, creditPill, freshSession, needsRealBackend, noHorizontalScroll, runCheck, wallet, watchErrors } from "./helpers";

needsRealBackend();

test("@mobile the check page fits a phone, controls are touch-sized, and a check completes", async ({ page, context }) => {
  const errors = watchErrors(page);
  await freshSession(context, page);
  await noHorizontalScroll(page);

  // primary controls are at least 44 x 44 CSS px
  for (const [name, loc] of [
    ["mic", page.getByRole("button", { name: /push to talk/i })],
    ["check button", page.getByRole("button", { name: /check wallet/i })],
    ["credit pill", creditPill(page)],
    ["menu launcher", page.getByRole("button", { name: /open menu/i })],
    ["address field", addressField(page)],
  ] as const) {
    const box = await loc.boundingBox();
    expect(box, name).not.toBeNull();
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(43.5);
    expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(43.5);
  }

  await runCheck(page, wallet(500), "ALLOW");
  await expect(page.locator("canvas").first()).toBeVisible();
  await noHorizontalScroll(page);
  expect(errors()).toEqual([]);
});

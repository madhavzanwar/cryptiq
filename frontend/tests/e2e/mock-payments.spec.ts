import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

// These scenarios use the mock backend's DEMO-… wallets and payment simulation; the real backend has its own spec.
test.skip(process.env.E2E_REAL === "1", "mock-backend scenario");

test("crypto invoice shows a QR and URI, and 'Simulate payment' adds credits", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/credits");
  await page.getByRole("tab", { name: /crypto|cake/i }).click();
  await page.getByRole("button", { name: /create invoice/i }).click();
  await expect(page.locator("svg").filter({ has: page.locator("path") }).first()).toBeVisible();
  await expect(page.getByText(/bitcoin:|monero:/i).first()).toBeVisible();
  await page.getByRole("button", { name: /simulate payment/i }).click();
  await expect(page.getByText(/paid/i).first()).toBeVisible({ timeout: 15_000 });
  expect(errors()).toEqual([]);
});

test("Dodo checkout redirects to the url the API returns (mock: success page)", async ({ page }) => {
  await page.goto("/credits");
  await page.getByRole("button", { name: /continue to checkout/i }).click();
  await expect(page).toHaveURL(/credits\/success/);
  await expect(page.getByText(/credits added/i)).toBeVisible();
});

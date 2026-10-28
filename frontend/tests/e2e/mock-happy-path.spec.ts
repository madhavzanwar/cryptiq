import { expect, test } from "@playwright/test";
import { creditPill, needsMocks, noHorizontalScroll, watchErrors } from "./helpers";

needsMocks();


test.describe("check flow (mock backend)", () => {
  test("demo wallet -> progress -> verdict -> graph -> explanation -> credit decrements", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/check");
    await expect(creditPill(page)).toHaveAccessibleName(/3 credits left/i);

    await page.getByRole("button", { name: /known illicit/i }).first().click();
    await expect(page.getByLabel(/wallet address/i)).toHaveValue("DEMO-ILLICIT-01");
    await page.getByRole("button", { name: /check wallet/i }).click();

    // progress steps appear while the check runs, then the verdict card
    await expect(page.getByText(/querying tigergraph|validating address/i).first()).toBeVisible();
    await expect(page.getByText("BLOCK", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("meter")).toBeVisible();

    // honesty lines are on the result
    await expect(page.getByText(/risk signal, not an accusation/i).first()).toBeVisible();
    await expect(page.getByText(/research dataset/i).first()).toBeVisible();

    // evidence graph canvas + list alternative exist
    await expect(page.locator("canvas").first()).toBeVisible();

    // one credit used
    await expect(creditPill(page)).toHaveAccessibleName(/2 credits left/i);

    // Hindi explanation tab
    await page.getByRole("tab", { name: /हिन्दी|hindi/i }).click();
    await expect(page.getByRole("tabpanel").filter({ hasText: /[ऀ-ॿ]/ }).first()).toBeVisible();

    await noHorizontalScroll(page);
    expect(errors()).toEqual([]);
  });

  test("a wallet outside the dataset is UNKNOWN and costs nothing", async ({ page }) => {
    await page.goto("/check");
    await page.getByRole("button", { name: /not in dataset/i }).first().click();
    await page.getByRole("button", { name: /check wallet/i }).click();
    await expect(page.getByText("UNKNOWN", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(creditPill(page)).toHaveAccessibleName(/3 credits left/i);
  });

  test("a pasted seed phrase is cleared, never sent, and warned about", async ({ page }) => {
    let checkCalls = 0;
    page.on("request", (r) => {
      if (/\/api\/check/.test(r.url())) checkCalls++;
    });
    await page.goto("/check");
    const field = page.getByLabel(/wallet address/i);
    await field.fill("legal winner thank year wave sausage worth useful legal winner thank yellow");
    await expect(field).toHaveValue("");
    await expect(page.getByRole("alert").filter({ hasText: /seed phrase|secret key/i })).toBeVisible();
    expect(checkCalls).toBe(0);
  });

  test("zero credits turns the button into 'Buy credits' and opens the drawer", async ({ page }) => {
    await page.goto("/check");
    for (const chip of [/known illicit/i, /borderline/i, /clean/i]) {
      await page.getByRole("button", { name: chip }).first().click();
      await page.getByRole("button", { name: /check wallet/i }).click();
      await expect(page.getByText(/ALLOW|WARN|BLOCK/).first()).toBeVisible({ timeout: 20_000 });
    }
    await expect(creditPill(page)).toHaveAccessibleName(/0 credits left/i);
    await page.getByRole("button", { name: /buy credits/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("mobile @mobile", () => {
  test("check page fits a phone and completes a check", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/check");
    await noHorizontalScroll(page);
    await page.getByRole("button", { name: /clean/i }).first().click();
    await page.getByRole("button", { name: /check wallet/i }).click();
    await expect(page.getByText("ALLOW", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    expect(errors()).toEqual([]);
  });
});

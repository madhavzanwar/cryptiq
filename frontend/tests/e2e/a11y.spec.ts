import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { MOCKS, freshSession, runCheck, wallet } from "./helpers";

/** No critical or serious axe violations (WCAG 2.0/2.1 A + AA and axe best practices) on a production build. */
async function seriousViolations(page: Page) {
  // Animations (mic pulse, reveals) would make colour-contrast checks depend on the frame: freeze them.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.impact}: ${v.id} (${v.help}) -> ${v.nodes.slice(0, 4).map((n) => n.target.join(" ")).join(" | ")}`);
}

test("axe: /check (idle)", async ({ page }) => {
  await page.goto("/check");
  await expect(page.locator("h1").first()).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test("axe: /check (with a result, graph and explanation on screen)", async ({ page, context }) => {
  if (MOCKS) {
    await page.goto("/check");
    await page.getByRole("button", { name: /known illicit/i }).first().click();
    await page.getByRole("button", { name: /check wallet/i }).click();
    await expect(page.getByText("BLOCK", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  } else {
    await freshSession(context, page);
    await runCheck(page, wallet(400), "ALLOW");
  }
  await expect(page.locator("canvas").first()).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test("axe: /about", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("h1").first()).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test("axe: /benchmark", async ({ page }) => {
  await page.goto("/benchmark");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/not measured yet/i)).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

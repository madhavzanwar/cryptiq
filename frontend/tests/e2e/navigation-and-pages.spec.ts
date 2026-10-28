import { expect, test } from "@playwright/test";
import { noHorizontalScroll, watchErrors } from "./helpers";

test("side dock opens, navigates to each page and closes with Escape", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  for (const [name, path] of [["Benchmark", "/benchmark"], ["Credits", "/credits"], ["About", "/about"]] as const) {
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(path));
  }
  await page.getByRole("button", { name: /open menu/i }).click();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^check$/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /open menu/i })).toBeFocused();
  expect(errors()).toEqual([]);
});

test("language toggle switches the UI to Hindi and back", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("radio", { name: "हिन्दी" }).first().check({ force: true });
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.getByRole("radio", { name: "English" }).first().check({ force: true });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

for (const path of ["/", "/check", "/benchmark", "/credits", "/history", "/about", "/settings", "/privacy", "/demo"]) {
  test(`${path} renders without errors or horizontal scroll`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await noHorizontalScroll(page);
    expect(errors()).toEqual([]);
  });
}

test("unknown route shows the friendly 404", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("benchmark never shows invented numbers: not measured yet", async ({ page }) => {
  await page.goto("/benchmark");
  await expect(page.getByText(/not measured yet/i)).toBeVisible();
});

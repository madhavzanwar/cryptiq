import { expect, test, type Page } from "@playwright/test";
import { watchErrors } from "./helpers";

const DEVANAGARI = /[ऀ-ॿ]/;
const uiLanguage = (page: Page) => page.getByRole("radiogroup", { name: /^(Language|भाषा)$/ });
const h1 = (page: Page) => page.locator("h1").first();

test("the Hindi toggle changes visible labels on every main page, persists across reloads, and switches back", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/check");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishTitle = (await h1(page).innerText()).trim();
  const englishNav = await page.getByRole("button", { name: /open menu/i }).count();
  expect(englishNav).toBe(1);
  expect(englishTitle).not.toMatch(DEVANAGARI);

  await uiLanguage(page).getByText("हिं").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(h1(page)).toHaveText(DEVANAGARI);
  expect((await h1(page).innerText()).trim()).not.toBe(englishTitle);
  await expect(page.getByRole("button", { name: /मेन्यू खोलें/ })).toBeVisible(); // the side-dock launcher label

  // other pages are Hindi too, and the choice survives navigation and a full reload
  for (const path of ["/credits", "/about", "/benchmark", "/history"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(h1(page), `${path} heading`).toHaveText(DEVANAGARI);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(h1(page)).toHaveText(DEVANAGARI);

  // back to English: all labels return
  await uiLanguage(page).getByText("EN").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(h1(page)).not.toHaveText(DEVANAGARI);
  await page.goto("/check");
  expect((await h1(page).innerText()).trim()).toBe(englishTitle);
  expect(errors()).toEqual([]);
});

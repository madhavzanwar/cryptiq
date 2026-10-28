import { expect, test } from "@playwright/test";
import { addressField, creditPill, freshSession, needsRealBackend, startCheck, verdictBadge, watchErrors } from "./helpers";

needsRealBackend();

interface DemoWallet {
  address: string;
  expected: "ALLOW" | "WARN" | "BLOCK" | "UNKNOWN";
}

test("every demo wallet from /api/demo-wallets shows the verdict the backend expects", async ({ page, context, request }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  const res = await request.get("/api/demo-wallets"); // through the Next.js /api rewrite, like the browser
  expect(res.ok()).toBe(true);
  const wallets = ((await res.json()) as { wallets: DemoWallet[] }).wallets;
  // The fixture's demo set: 3 BLOCK, 3 ALLOW, 1 UNKNOWN (it has no WARN wallet; WARN is covered by unit tests and the mock backend).
  expect(wallets.map((w) => w.expected).sort()).toEqual(["ALLOW", "ALLOW", "ALLOW", "BLOCK", "BLOCK", "BLOCK", "UNKNOWN"]);

  for (const w of wallets) {
    await test.step(`${w.address} -> ${w.expected}`, async () => {
      await freshSession(context, page); // new session = 3 credits, so credits never run out between wallets
      await startCheck(page, w.address);
      const badge = verdictBadge(page, w.expected);
      await expect(badge).toBeVisible({ timeout: 30_000 });

      // verdict = icon + word, never colour alone
      await expect(badge.locator("svg")).toHaveCount(1);
      await expect(badge).toHaveText(w.expected);

      if (w.expected === "UNKNOWN") {
        await expect(page.getByRole("img", { name: /risk score.*(n\/a|लागू नहीं)/i })).toBeVisible();
        await expect(creditPill(page)).toHaveAccessibleName(/\b3\b/); // not in the dataset: free
      } else {
        const meter = page.getByRole("meter");
        await expect(meter).toBeVisible();
        const score = Number(await meter.getAttribute("aria-valuenow"));
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        if (w.expected === "BLOCK") expect(score).toBeGreaterThanOrEqual(70);
        if (w.expected === "ALLOW") expect(score).toBeLessThan(30);
        await expect(creditPill(page)).toHaveAccessibleName(/\b2\b/); // charged once
      }
      await expect(page.getByText(/risk signal, not an accusation/i).first()).toBeVisible();
      await expect(page.getByText(/research dataset/i).first()).toBeVisible();
      await expect(addressField(page)).toHaveValue(w.address);
    });
  }
  expect(errors()).toEqual([]);
});

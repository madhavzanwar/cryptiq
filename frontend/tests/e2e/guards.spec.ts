import { expect, test } from "@playwright/test";
import { addressField, creditsLeft, freshSession, needsRealBackend, recordRequests, watchErrors } from "./helpers";

needsRealBackend();

const SEED = "legal winner thank year wave sausage worth useful legal winner thank yellow";
const HEX_KEY = "ab".repeat(32);
const SENT = /\/api\/(check|transcribe)/;

test("a typed or pasted seed phrase / private key is cleared, warned about, and NOTHING is sent", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const sent = recordRequests(page, SENT);
  const errors = watchErrors(page);
  await freshSession(context, page);
  const field = addressField(page);
  const warning = page.getByRole("alert").filter({ hasText: /seed phrase|secret key|सीड|सीक्रेट/i });

  // typed
  await field.fill(SEED);
  await expect(field).toHaveValue("");
  await expect(warning).toBeVisible();

  // a raw 64-hex private key
  await field.fill(HEX_KEY);
  await expect(field).toHaveValue("");
  await expect(warning).toBeVisible();

  // pasted through the "Paste from clipboard" button
  await page.evaluate((t) => navigator.clipboard.writeText(t), SEED);
  await page.getByRole("button", { name: /paste from clipboard|क्लिपबोर्ड/i }).click();
  await expect(field).toHaveValue("");
  await expect(warning).toBeVisible();

  // pressing Enter in the empty field must not send anything either
  await field.press("Enter");
  expect(sent(), "requests to /api/check or /api/transcribe").toEqual([]);
  expect(await creditsLeft(page)).toBe(3);
  expect(errors()).toEqual([]);
});

// A well-formed bech32 string with a wrong checksum: it passes the browser's format check, the backend answers 400 invalid_address.
const BAD_CHECKSUM = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdp";

test("an address with a bad checksum shows the friendly error (EN and HI), costs nothing and does not crash", async ({ page, context }) => {
  const errors = watchErrors(page);
  await freshSession(context, page);

  const bad = page.waitForResponse((r) => new URL(r.url()).pathname.startsWith("/api/check") && r.status() === 400);
  await addressField(page).fill(BAD_CHECKSUM);
  await page.getByRole("button", { name: /check wallet/i }).click();
  expect((await bad).status()).toBe(400);

  const friendly = page.getByRole("alert").filter({ hasText: /does not look like a valid bitcoin address/i });
  await expect(friendly).toBeVisible();
  await expect(friendly).not.toContainText(/invalid_address|undefined|\[object/i); // no raw error codes
  expect(await creditsLeft(page)).toBe(3);
  await expect(addressField(page)).toBeVisible(); // the page is still usable

  // same error in Hindi
  await page.getByRole("radiogroup", { name: "Language", exact: true }).getByText("हिं").click();
  await page.getByRole("button", { name: /जाँचें|check wallet/i }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: /यह सही बिटकॉइन पता नहीं लगता/ })).toBeVisible();
  expect(errors()).toEqual([]);
});

test("garbage that fails the format check is explained inline and never sent", async ({ page, context }) => {
  const sent = recordRequests(page, SENT);
  await freshSession(context, page);
  await addressField(page).fill("hello world");
  await expect(page.getByText(/does not look like a bitcoin address/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /check wallet/i })).toBeDisabled();
  expect(sent()).toEqual([]);
});

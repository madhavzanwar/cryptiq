import { expect, test } from "@playwright/test";
import { creditPill, freshSession, needsRealBackend, verdictBadge, wallet, watchErrors } from "./helpers";

needsRealBackend();

/** A stand-in for the browser's speech recognition that "hears" a known demo wallet. Counts how often it was started. */
const FAKE_SPEECH = (address: string) => `
  window.__speech = { started: 0 };
  class FakeRecognition {
    continuous = false; interimResults = false; maxAlternatives = 1; lang = "";
    onresult = null; onerror = null; onend = null;
    start() {
      window.__speech.started++;
      setTimeout(() => {
        const result = Object.assign([{ transcript: ${JSON.stringify(address)} }], { isFinal: true });
        this.onresult && this.onresult({ results: [result] });
      }, 200);
    }
    stop() { setTimeout(() => this.onend && this.onend(), 30); }
    abort() { this.onend && this.onend(); }
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
`;

test("voice_unavailable (503) falls back to the browser's speech recognition and the check still works", async ({ page, context }) => {
  const heard = wallet(300);
  await page.addInitScript(FAKE_SPEECH(heard));
  const errors = watchErrors(page);
  await freshSession(context, page);
  const mic = page.getByRole("button", { name: /push to talk/i });
  await expect(mic).toBeVisible();

  // 1) first press: the audio goes to the backend, which has no voice keys and answers 503 voice_unavailable
  const transcribe = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/transcribe");
  await mic.hover();
  await page.mouse.down();
  await expect(page.getByText(/0:0[1-9]/)).toBeVisible(); // recorded for about a second (fake microphone device)
  await page.mouse.up();
  const res = await transcribe;
  expect(res.status()).toBe(503);
  expect((await res.json()).error).toBe("voice_unavailable");

  // friendly message + the voice chip says browser; no confirm box, no check was started
  await expect(page.getByText(/switched to your browser's speech recognition/i)).toBeVisible();
  await expect(page.getByText("Voice: browser")).toBeVisible();
  await expect(page.getByRole("heading", { name: /confirm what we heard/i })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __speech: { started: number } }).__speech.started)).toBe(0);

  // 2) second press: the BROWSER recognises the address; the person must confirm it before a credit is used
  await mic.hover();
  await page.mouse.down();
  await expect(page.getByText(/0:0[1-9]/)).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: /confirm what we heard/i })).toBeVisible();
  await expect(page.getByText(heard).first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __speech: { started: number } }).__speech.started)).toBe(1);
  await expect(creditPill(page)).toHaveAccessibleName(/\b3\b/); // nothing charged before the confirmation

  await page.getByRole("button", { name: /confirm and check/i }).click();
  await expect(verdictBadge(page, "ALLOW")).toBeVisible({ timeout: 30_000 });
  await expect(creditPill(page)).toHaveAccessibleName(/\b2\b/);
  expect(errors()).toEqual([]);
});

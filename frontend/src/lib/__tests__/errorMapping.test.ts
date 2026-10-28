import { describe, expect, it } from "vitest";
import { ApiError, messageFor, type ErrorAction } from "@/lib/api/errors";

/** Every backend error from docs/api-contract.md that the UI must turn into a friendly EN + HI message. */
const CASES: { name: string; status: number; code: string; action: ErrorAction }[] = [
  { name: "402 no_credits", status: 402, code: "no_credits", action: "open-credits" },
  { name: "400 invalid_address", status: 400, code: "invalid_address", action: "fix-address" },
  { name: "400 secret_input", status: 400, code: "secret_input", action: "seed-phrase-warning" },
  { name: "413 request_too_large", status: 413, code: "request_too_large", action: "none" },
  { name: "415 unsupported_audio_type", status: 415, code: "unsupported_audio_type", action: "none" },
  { name: "422 invalid request", status: 422, code: "invalid request: address", action: "none" },
  { name: "429 rate_limited", status: 429, code: "rate_limited", action: "retry-later" },
  { name: "500 internal_error", status: 500, code: "internal_error", action: "none" },
  { name: "503 voice_unavailable", status: 503, code: "voice_unavailable", action: "use-browser-speech" },
  { name: "409 try_again", status: 409, code: "try_again", action: "retry-later" },
  { name: "409 benchmark_running", status: 409, code: "benchmark_running", action: "retry-later" },
  { name: "network failure", status: 0, code: "network_error", action: "check-connection" },
];

const GENERIC = {
  en: messageFor(new Error("unknown thing"), "en").message,
  hi: messageFor(new Error("unknown thing"), "hi").message,
};

describe("messageFor covers every documented error", () => {
  it.each(CASES)("$name -> friendly EN + HI message and the right action", ({ status, code, action }) => {
    const err = new ApiError({ status, code });
    const en = messageFor(err, "en");
    const hi = messageFor(err, "hi");
    expect(en.action).toBe(action);
    expect(hi.action).toBe(action);
    expect(en.message).not.toBe(GENERIC.en);
    expect(hi.message).not.toBe(GENERIC.hi);
    expect(en.message.length).toBeGreaterThan(10);
    expect(/[ऀ-ॿ]/.test(hi.message), "Hindi message contains Devanagari").toBe(true);
    expect(/[ऀ-ॿ]/.test(en.message)).toBe(false);
  });
  it("falls back on the HTTP status when the code is unknown", () => {
    expect(messageFor(new ApiError({ status: 429, code: "something_new" }), "en").action).toBe("retry-later");
    expect(messageFor(new ApiError({ status: 402, code: "weird" }), "en").action).toBe("open-credits");
  });
  it("never shows raw codes or stack text", () => {
    for (const c of CASES) {
      const m = messageFor(new ApiError({ status: c.status, code: c.code }), "en").message;
      expect(m).not.toContain(c.code);
      expect(m).not.toMatch(/Error:|undefined|\[object/);
    }
  });
});

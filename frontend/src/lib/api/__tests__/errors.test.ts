import { describe, expect, it } from "vitest";
import { ApiError, messageFor, type ErrorAction } from "../errors";

const err = (status: number, code: string) => new ApiError({ status, code });

describe("messageFor", () => {
  const cases: [number, string, ErrorAction][] = [
    [402, "no_credits", "open-credits"],
    [400, "secret_input", "seed-phrase-warning"],
    [400, "invalid_address", "fix-address"],
    [503, "voice_unavailable", "use-browser-speech"],
    [409, "try_again", "retry-later"],
    [409, "benchmark_running", "retry-later"],
    [429, "rate_limited", "retry-later"],
    [413, "request_too_large", "none"],
    [413, "audio_too_large", "none"],
    [413, "audio_too_long", "none"],
    [415, "unsupported_audio_type", "none"],
    [422, "invalid request: address", "none"],
    [500, "internal_error", "none"],
    [503, "crypto_unavailable", "retry-later"],
    [503, "payments_unavailable", "retry-later"],
    [503, "llm_unavailable", "retry-later"],
    [503, "model_not_trained", "retry-later"],
    [503, "graph_unavailable", "retry-later"],
    [0, "network_error", "check-connection"],
    [200, "stream_ended", "retry-later"],
    [200, "invalid_response", "retry-later"],
  ];

  it.each(cases)("%i %s -> %s, with English and Hindi text", (status, code, action) => {
    const en = messageFor(err(status, code), "en");
    const hi = messageFor(err(status, code), "hi");
    expect(en.action).toBe(action);
    expect(hi.action).toBe(action);
    expect(en.message).not.toBe(hi.message);
    expect(en.message.length).toBeGreaterThan(10);
    expect(hi.message).toMatch(/[ऀ-ॿ]/); // Devanagari
    expect(en.message).not.toMatch(/[ऀ-ॿ]/);
    expect(en.message).not.toContain(code); // never leak raw codes to users
  });

  it("shows the seed phrase warning", () => {
    expect(messageFor(err(400, "secret_input"), "en").message).toContain("Never share your seed phrase or private key");
  });

  it("falls back on the HTTP status for unknown codes", () => {
    expect(messageFor(err(429, "whatever"), "en").action).toBe("retry-later");
    expect(messageFor(err(402, "whatever"), "en").action).toBe("open-credits");
    expect(messageFor(err(500, "boom"), "en").message).toBe(messageFor(err(500, "internal_error"), "en").message);
  });

  it("maps free-text codes", () => {
    expect(messageFor(err(400, "sample_size_above_cap_50"), "en").message).toContain("too big");
    expect(messageFor(err(422, "audio_conversion_timeout"), "en").message).toBe(
      messageFor(err(422, "audio_unreadable"), "en").message,
    );
  });

  it("is generic for non-ApiError values and unknown codes", () => {
    const g = messageFor(new Error("x"), "en");
    expect(g).toEqual({ message: "Something went wrong. Please try again.", action: "none" });
    expect(messageFor("boom", "hi").action).toBe("none");
    expect(messageFor(err(400, "constructor"), "en").action).toBe("none");
  });

  it("describes an aborted request quietly", () => {
    expect(messageFor(err(0, "aborted"), "en").action).toBe("none");
  });
});

describe("ApiError", () => {
  it("is an Error with status, code and optional body", () => {
    const e = new ApiError({ status: 402, code: "no_credits" });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.name).toBe("ApiError");
    expect(e.message).toBe("no_credits");
    expect(e.body).toBeUndefined();
  });
});

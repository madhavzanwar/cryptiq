import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCheckFlow } from "@/lib/hooks/checkFlow";

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const sse = (...events: { event: string; data: unknown }[]) =>
  new Response(events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join(""), { status: 200, headers: { "content-type": "text/event-stream" } });

const ADDR = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

async function runWith(fetchImpl: () => Promise<Response>, lang: "en" | "hi" = "en") {
  vi.stubGlobal("fetch", vi.fn(fetchImpl));
  const { result } = renderHook(() => useCheckFlow());
  let outcome: Awaited<ReturnType<typeof result.current.run>> | undefined;
  await act(async () => {
    outcome = await result.current.run(ADDR, lang);
  });
  return { outcome: outcome!, state: result.current.state };
}

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());

describe("useCheckFlow error handling (stubbed backend)", () => {
  it.each([
    ["402 no_credits", () => json({ error: "no_credits" }, 402), "open-credits"],
    ["400 invalid_address", () => json({ error: "invalid_address" }, 400), "fix-address"],
    ["400 secret_input", () => json({ error: "secret_input" }, 400), "seed-phrase-warning"],
    ["429 rate_limited", () => json({ error: "rate_limited" }, 429), "retry-later"],
    ["500 internal_error", () => json({ error: "internal_error" }, 500), "none"],
  ] as const)("%s", async (_n, make, action) => {
    const { outcome, state } = await runWith(async () => make());
    expect(outcome).toMatchObject({ status: "error", action });
    expect(state.phase).toBe("error");
    if (state.phase === "error") expect(state.message.length).toBeGreaterThan(10);
  });

  it("network failure -> check-connection, message in Hindi when the UI is Hindi", async () => {
    const { outcome, state } = await runWith(() => Promise.reject(new TypeError("Failed to fetch")), "hi");
    expect(outcome).toMatchObject({ status: "error", code: "network_error", action: "check-connection" });
    if (state.phase === "error") expect(/[ऀ-ॿ]/.test(state.message)).toBe(true);
  });

  it("a late SSE `error` event (402 after the stream opened) is handled like a normal no_credits error", async () => {
    const { outcome, state } = await runWith(async () =>
      sse({ event: "step", data: { id: "validate", label: "Validating address" } }, { event: "error", data: { error: "no_credits", status: 402 } }),
    );
    expect(outcome).toMatchObject({ status: "error", code: "no_credits", action: "open-credits" });
    expect(state.phase).toBe("error");
  });

  it("a stream that ends without a result is reported, not hung", async () => {
    const { outcome } = await runWith(async () => sse({ event: "step", data: { id: "validate", label: "Validating address" } }));
    expect(outcome).toMatchObject({ status: "error", code: "stream_ended" });
  });
});

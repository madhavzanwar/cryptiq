import { afterEach, describe, expect, it, vi } from "vitest";
import { buildUrl, createApiClient } from "../client";
import { ApiError } from "../errors";

const zero = { illicit: 0, licit: 0, unknown: 0 };

const checkBody = (over: Record<string, unknown> = {}) => ({
  status: "ok",
  address: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
  chain: "bitcoin",
  verdict: "WARN",
  riskScore: 55,
  datasetLabel: "unknown",
  hopsToNearestIllicit: 2,
  neighbors: { hop1: zero, hop2: zero },
  graphFeatures: { pagerank: 1e-6, componentSize: 10 },
  labelHits: { ofac: false, ransomwhere: false },
  topReasons: [],
  subgraph: { nodes: [], links: [] },
  tigergraph: { queryName: "khop_exposure", ms: 5 },
  model: { name: "xgboost-baseline" },
  explanation: { en: "e", hi: "ह" },
  limitations: [],
  ...over,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Call = { url: string; init: RequestInit };

function mockFetch(respond: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init: init ?? {} };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return { calls, fetchImpl };
}

afterEach(() => vi.unstubAllGlobals());

describe("buildUrl", () => {
  it("supports same origin and trailing slashes", () => {
    expect(buildUrl("", "/api/health")).toBe("/api/health");
    expect(buildUrl("https://api.example.com/", "/api/health")).toBe("https://api.example.com/api/health");
    expect(buildUrl("https://api.example.com", "/api/health")).toBe("https://api.example.com/api/health");
  });
});

describe("createApiClient requests", () => {
  it("check posts JSON, sends credentials, and returns a typed response", async () => {
    const { calls, fetchImpl } = mockFetch(() => json(checkBody()));
    const r = await createApiClient({ baseUrl: "", fetchImpl }).check("1Boat", "hi");
    expect(r.verdict).toBe("WARN");
    const [call] = calls;
    expect(call?.url).toBe("/api/check");
    expect(call?.init.method).toBe("POST");
    expect(call?.init.credentials).toBe("include");
    expect(JSON.parse(String(call?.init.body))).toEqual({ address: "1Boat", lang: "hi" });
    expect(new Headers(call?.init.headers).get("content-type")).toBe("application/json");
  });

  it("every method hits the right path with credentials: include", async () => {
    const bodies: Record<string, unknown> = {
      "/api/transcribe": { text: "t", address: null, provider: "browser" },
      "/api/credits": { balance: 3, packs: [] },
      "/api/checkout": { url: "https://pay.example/c" },
      "/api/crypto-invoice": {
        invoiceId: "inv 1", uri: "u", address: "a", amount: "1", coin: "btc", expiresAt: "t",
      },
      "/api/crypto-invoice/inv%201": { status: "waiting" },
      "/api/demo-wallets": { wallets: [] },
      "/api/benchmark": { status: "not_measured" },
      "/api/benchmark/run": { jobId: "bench_1" },
      "/api/benchmark/job/bench_1": { status: "running", progress: 0.5 },
      "/api/health": { ok: true, voiceProvider: "browser" },
    };
    const { calls, fetchImpl } = mockFetch(({ url }) => json(bodies[url.replace("https://api.example.com", "")]));
    const api = createApiClient({ baseUrl: "https://api.example.com", fetchImpl });
    await api.transcribe(new Blob(["x"], { type: "audio/webm" }), "en");
    await api.credits();
    await api.checkout("starter");
    await api.createInvoice("starter", "btc");
    await api.invoiceStatus("inv 1");
    await api.demoWallets();
    await api.benchmark();
    await api.runBenchmark(25);
    await api.benchmarkJob("bench_1");
    await api.health();
    expect(calls.map((c) => c.url.replace("https://api.example.com", ""))).toEqual(Object.keys(bodies));
    expect(calls.every((c) => c.init.credentials === "include")).toBe(true);
    expect(calls.map((c) => c.init.method)).toEqual([
      "POST", "GET", "POST", "POST", "GET", "GET", "GET", "POST", "GET", "GET",
    ]);
    expect(JSON.parse(String(calls[2]?.init.body))).toEqual({ packId: "starter" });
    expect(JSON.parse(String(calls[3]?.init.body))).toEqual({ packId: "starter", coin: "btc" });
    expect(JSON.parse(String(calls[7]?.init.body))).toEqual({ sampleSize: 25 });
  });

  it("transcribe sends multipart audio + lang without a manual content-type", async () => {
    const { calls, fetchImpl } = mockFetch(() => json({ text: "t", address: "1A", provider: "wispr" }));
    await createApiClient({ baseUrl: "", fetchImpl }).transcribe(new Blob(["abc"], { type: "audio/ogg;codecs=opus" }), "hi");
    const body = calls[0]?.init.body;
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(form.get("lang")).toBe("hi");
    const file = form.get("audio") as File;
    expect(file.name).toBe("audio.ogg");
    expect(await file.text()).toBe("abc");
    expect(calls[0]?.init.headers).toBeUndefined();
  });

  it("uses the global fetch lazily when fetchImpl is omitted", async () => {
    const spy = vi.fn(async () => json({ ok: true, voiceProvider: "browser" }));
    vi.stubGlobal("fetch", spy);
    await createApiClient({ baseUrl: "" }).health();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("createApiClient errors", () => {
  const api = (respond: () => Response | Promise<Response>) =>
    createApiClient({ baseUrl: "", fetchImpl: mockFetch(respond).fetchImpl });

  it.each([
    [402, "no_credits"],
    [400, "secret_input"],
    [400, "invalid_address"],
    [429, "rate_limited"],
    [409, "try_again"],
  ])("throws ApiError(%i, %s) from the {error} body", async (status, code) => {
    const e = await api(() => json({ error: code }, status)).check("x", "en").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status, code });
    expect((e as ApiError).body).toBeUndefined();
  });

  it("returns a 503 CheckResponse body as a typed error that carries the body", async () => {
    const body = checkBody({
      status: "error", error: "graph_unavailable", verdict: "UNKNOWN", riskScore: null,
      datasetLabel: null, hopsToNearestIllicit: null, creditsRemaining: 3,
    });
    const e = await api(() => json(body, 503)).check("x", "en").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    const err = e as ApiError;
    expect(err.status).toBe(503);
    expect(err.code).toBe("graph_unavailable");
    expect(err.body?.status).toBe("error");
    expect(err.body?.creditsRemaining).toBe(3);
  });

  it("handles an error with a non-JSON body", async () => {
    const e = await api(() => new Response("<html>bad gateway</html>", { status: 502 })).health().catch((x: unknown) => x);
    expect(e).toMatchObject({ status: 502, code: "http_502" });
  });

  it("flags a 200 with the wrong shape as invalid_response", async () => {
    const e = await api(() => json({ nope: true })).credits().catch((x: unknown) => x);
    expect(e).toMatchObject({ code: "invalid_response", status: 200 });
    const empty = await api(() => new Response("", { status: 200 })).credits().catch((x: unknown) => x);
    expect(empty).toMatchObject({ code: "invalid_response" });
  });

  it("maps fetch rejections to network_error", async () => {
    const e = await api(() => Promise.reject(new TypeError("Failed to fetch"))).health().catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 0, code: "network_error" });
  });

  it("maps aborts to aborted and passes the signal to fetch", async () => {
    const ctrl = new AbortController();
    const { calls, fetchImpl } = mockFetch(({ init }) => {
      ctrl.abort();
      return Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError", signal: init.signal }));
    });
    const e = await createApiClient({ baseUrl: "", fetchImpl }).health({ signal: ctrl.signal }).catch((x: unknown) => x);
    expect(e).toMatchObject({ code: "aborted" });
    expect(calls[0]?.init.signal).toBe(ctrl.signal);
  });
});

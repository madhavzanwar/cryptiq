import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import { createSseParser, streamCheck, type SseMessage, type StreamHandlers } from "../sse";
import type { CheckResponse, StepEvent } from "../types";

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
  graphFeatures: {},
  labelHits: { ofac: false, ransomwhere: false },
  topReasons: [],
  subgraph: { nodes: [], links: [] },
  tigergraph: { queryName: "networkx.khop_exposure", ms: 5 },
  model: { name: "xgboost-baseline" },
  explanation: { en: "e", hi: "जोखिम" },
  limitations: [],
  creditsRemaining: 2,
  ...over,
});

const STEPS = [
  ["validate", "Validating address"],
  ["graph", "Querying TigerGraph"],
  ["hops", "Measuring hops to flagged wallets"],
  ["score", "Scoring risk"],
  ["explain", "Writing explanation"],
] as const;

const stepFrames = (eol = "\n") =>
  STEPS.map(([id, label]) => `event: step${eol}data: ${JSON.stringify({ id, label })}${eol}${eol}`).join("");

const resultFrame = (body: unknown, eol = "\n") => `event: result${eol}data: ${JSON.stringify(body)}${eol}${eol}`;

/** Splits text into chunks of `size` UTF-8 bytes, so multi-byte characters get cut in half too. */
function byteChunks(text: string, size: number): Uint8Array[] {
  const bytes = new TextEncoder().encode(text);
  const out: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) out.push(bytes.slice(i, i + size));
  return out;
}

function sseResponse(chunks: Uint8Array[], status = 200, hold = false): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(ch);
      if (!hold) c.close();
    },
  });
  return new Response(stream, { status, headers: { "content-type": "text/event-stream" } });
}

const enc = (s: string) => [new TextEncoder().encode(s)];

function run(response: () => Response | Promise<Response>, handlers: StreamHandlers = {}, signal?: AbortSignal) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return response();
  }) as typeof fetch;
  const promise = streamCheck({ baseUrl: "", fetchImpl }, "1Boat", "en", handlers, signal);
  return { promise, calls };
}

function parseAll(chunks: string[], end = true): SseMessage[] {
  const out: SseMessage[] = [];
  const p = createSseParser((m) => out.push(m));
  for (const c of chunks) p.push(c);
  if (end) p.end();
  return out;
}

describe("createSseParser", () => {
  it("parses LF, CRLF and CR line endings", () => {
    const expected = [{ event: "step", data: '{"id":"a"}' }];
    expect(parseAll(['event: step\ndata: {"id":"a"}\n\n'])).toEqual(expected);
    expect(parseAll(['event: step\r\ndata: {"id":"a"}\r\n\r\n'])).toEqual(expected);
    expect(parseAll(['event: step\rdata: {"id":"a"}\r\r'])).toEqual(expected);
  });

  it("joins multi-line data with \\n", () => {
    expect(parseAll(["event: result\ndata: line1\ndata: line2\ndata:\ndata: line4\n\n"])).toEqual([
      { event: "result", data: "line1\nline2\n\nline4" },
    ]);
  });

  it("survives any chunk split, including inside CRLF", () => {
    const text = 'event: step\r\ndata: {"id":"validate"}\r\n\r\nevent: result\r\ndata: a\r\ndata: b\r\n\r\n';
    const expected = parseAll([text]);
    expect(expected).toHaveLength(2);
    for (let size = 1; size < 12; size++) {
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
      expect(parseAll(chunks), `size ${size}`).toEqual(expected);
    }
  });

  it("ignores comments, pings, unknown fields, and strips one leading space only", () => {
    const out = parseAll([": ping - 2026\n\nretry: 1000\nfoo: bar\nevent:  e\ndata:  two spaces\nid: 7\n\n"]);
    expect(out).toEqual([{ event: " e", data: " two spaces", id: "7" }]);
  });

  it("defaults the event name to message and skips events without data", () => {
    expect(parseAll(["data: x\n\nevent: only-name\n\n"])).toEqual([{ event: "message", data: "x" }]);
  });

  it("drops a leading BOM", () => {
    expect(parseAll(["﻿event: step\ndata: 1\n\n"])).toEqual([{ event: "step", data: "1" }]);
  });

  it("flushes a final event without a blank line on end()", () => {
    expect(parseAll(["event: result\ndata: x"])).toEqual([{ event: "result", data: "x" }]);
    expect(parseAll(["event: result\ndata: x"], false)).toEqual([]);
  });
});

describe("streamCheck", () => {
  it("POSTs with credentials and delivers 5 steps then the result", async () => {
    const steps: StepEvent[] = [];
    const onResult = vi.fn();
    const { promise, calls } = run(
      () => sseResponse(enc(stepFrames() + resultFrame(checkBody()))),
      { onStep: (s: StepEvent) => steps.push(s), onResult },
    );
    const result = await promise;
    expect(result.verdict).toBe("WARN");
    expect(steps.map((s) => s.id)).toEqual(STEPS.map(([id]) => id));
    expect(onResult).toHaveBeenCalledWith(result);
    expect(calls[0]?.url).toBe("/api/check/stream");
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.credentials).toBe("include");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ address: "1Boat", lang: "en" });
    expect(new Headers(calls[0]?.init.headers).get("accept")).toBe("text/event-stream");
  });

  it("handles CRLF and byte-split chunks, including Hindi text cut mid-character", async () => {
    const body = stepFrames("\r\n") + resultFrame(checkBody({ explanation: { en: "e", hi: "जोखिम ज़्यादा है" } }), "\r\n");
    for (const size of [1, 2, 3, 7, 64]) {
      const r = await run(() => sseResponse(byteChunks(body, size))).promise;
      expect(r.explanation.hi).toBe("जोखिम ज़्यादा है");
    }
  });

  it("ignores ping comments and unknown events", async () => {
    const text = `: ping\n\nevent: mystery\ndata: {}\n\n${resultFrame(checkBody())}`;
    expect((await run(() => sseResponse(enc(text))).promise).status).toBe("ok");
  });

  it("returns a not_in_dataset result with null riskScore", async () => {
    const body = checkBody({ status: "not_in_dataset", verdict: "UNKNOWN", riskScore: null, datasetLabel: null, hopsToNearestIllicit: null });
    const r: CheckResponse = await run(() => sseResponse(enc(resultFrame(body)))).promise;
    expect(r.riskScore).toBeNull();
  });

  it("raises a typed error for event: error", async () => {
    const onError = vi.fn();
    const text = `${stepFrames().slice(0, 60)}\n\nevent: error\ndata: ${JSON.stringify({ error: "no_credits", status: 402 })}\n\n`;
    const e = await run(() => sseResponse(enc(text)), { onError }).promise.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 402, code: "no_credits" });
    expect(onError).toHaveBeenCalledWith(e);
  });

  it("raises stream_ended when the stream ends without result or error", async () => {
    const onError = vi.fn();
    const e = await run(() => sseResponse(enc(stepFrames())), { onError }).promise.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ code: "stream_ended" });
    expect(onError).toHaveBeenCalledOnce();
    const empty = await run(() => sseResponse([])).promise.catch((x: unknown) => x);
    expect(empty).toMatchObject({ code: "stream_ended" });
  });

  it("raises invalid_response for a malformed result", async () => {
    const e = await run(() => sseResponse(enc("event: result\ndata: {not json\n\n"))).promise.catch((x: unknown) => x);
    expect(e).toMatchObject({ code: "invalid_response" });
    const e2 = await run(() => sseResponse(enc(resultFrame({ verdict: "WARN" })))).promise.catch((x: unknown) => x);
    expect(e2).toMatchObject({ code: "invalid_response" });
  });

  it("turns a result with status error into an ApiError carrying the body", async () => {
    const body = checkBody({ status: "error", error: "graph_unavailable", verdict: "UNKNOWN", riskScore: null, datasetLabel: null, hopsToNearestIllicit: null });
    const onResult = vi.fn();
    const e = await run(() => sseResponse(enc(resultFrame(body))), { onResult }).promise.catch((x: unknown) => x);
    expect(e).toMatchObject({ status: 503, code: "graph_unavailable" });
    expect((e as ApiError).body?.status).toBe("error");
    expect(onResult).not.toHaveBeenCalled();
  });

  it.each([
    [402, "no_credits"],
    [400, "secret_input"],
    [400, "invalid_address"],
    [429, "rate_limited"],
  ])("raises ApiError for HTTP %i %s before the stream opens", async (status, code) => {
    const e = await run(() => Response.json({ error: code }, { status })).promise.catch((x: unknown) => x);
    expect(e).toMatchObject({ status, code });
  });

  it("raises network_error when fetch fails", async () => {
    const e = await run(() => Promise.reject(new TypeError("Failed to fetch"))).promise.catch((x: unknown) => x);
    expect(e).toMatchObject({ status: 0, code: "network_error" });
  });

  it("supports AbortSignal mid-stream", async () => {
    const ctrl = new AbortController();
    const response = () => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode(stepFrames().slice(0, 40)));
          ctrl.signal.addEventListener("abort", () =>
            c.error(Object.assign(new Error("The operation was aborted"), { name: "AbortError" })),
          );
        },
      });
      return new Response(stream, { status: 200 });
    };
    const onStep = vi.fn();
    const { promise, calls } = run(response, { onStep }, ctrl.signal);
    setTimeout(() => ctrl.abort(), 10);
    const e = await promise.catch((x: unknown) => x);
    expect(e).toMatchObject({ code: "aborted" });
    expect(calls[0]?.init.signal).toBe(ctrl.signal);
  });

  it("stops reading after the result and does not wait for the server to close", async () => {
    const r = await run(() => sseResponse(enc(resultFrame(checkBody())), 200, true)).promise;
    expect(r.status).toBe("ok");
  });

  it("lets handler exceptions through untouched", async () => {
    const boom = new Error("handler bug");
    const { promise } = run(() => sseResponse(enc(stepFrames() + resultFrame(checkBody()))), {
      onStep: () => {
        throw boom;
      },
    });
    await expect(promise).rejects.toBe(boom);
  });
});

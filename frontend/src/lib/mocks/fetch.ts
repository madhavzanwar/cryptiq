import type { CheckResponse } from "@/lib/api/types";
import { looksLikeSecret } from "@/lib/address/seedGuard";
import { validateAddress } from "@/lib/address/validate";
import { DEMO_WALLETS, fixtureFor } from "./fixtures";
import { mockConfig, mockState } from "./state";

/**
 * A fake backend with the same wire format as docs/api-contract.md, plugged into createApiClient via
 * `fetchImpl`. Used when NEXT_PUBLIC_USE_MOCKS=true; every response that carries data is marked `isMock`.
 */

const PACKS = [
  { id: "starter", credits: 10, priceUsd: 1, label: "Starter" },
  { id: "plus", credits: 50, priceUsd: 4, label: "Plus" },
  { id: "pro", credits: 200, priceUsd: 12, label: "Pro" },
];

const STEPS = [
  { id: "validate", label: "Validating address" },
  { id: "graph", label: "Querying TigerGraph" },
  { id: "hops", label: "Measuring hops to flagged wallets" },
  { id: "score", label: "Scoring risk" },
  { id: "explain", label: "Writing explanation" },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const err = (status: number, error: string) => json({ error }, status);

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (ms <= 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

const delay = (signal?: AbortSignal) => sleep(mockConfig.latency ? 400 + Math.random() * 1000 : 0, signal);

type CheckOutcome = { status: number; body: unknown; res?: CheckResponse };

/** Shared by /api/check and /api/check/stream: validation, credit gate, cache, charge. */
function runCheck(body: unknown): CheckOutcome {
  const { address, lang } = (body ?? {}) as { address?: unknown; lang?: unknown };
  if (typeof address !== "string" || (lang !== "en" && lang !== "hi")) return { status: 422, body: { error: "invalid request: address, lang" } };
  if (looksLikeSecret(address)) return { status: 400, body: { error: "secret_input" } };
  if (!validateAddress(address, { allowDemo: true }).ok) return { status: 400, body: { error: "invalid_address" } };

  const key = `${address.toUpperCase()}|${lang}`;
  const hit = mockState.cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) {
    const res = { ...(hit.res as CheckResponse), cached: true, creditsRemaining: mockState.balance };
    return { status: 200, body: res, res };
  }
  if (mockState.balance <= 0) return { status: 402, body: { error: "no_credits" } };

  const base = fixtureFor(address);
  const charged = base.status === "ok";
  if (charged) mockState.balance -= 1;
  const res: CheckResponse = { ...base, creditsRemaining: mockState.balance };
  mockState.cache.set(key, { at: Date.now(), res });
  return { status: 200, body: res, res };
}

async function readBody(init?: RequestInit): Promise<unknown> {
  const b = init?.body;
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return undefined;
    }
  }
  return b;
}

function sse(steps: { id: string; label: string }[], final: { event: string; data: unknown }, signal?: AbortSignal) {
  const enc = new TextEncoder();
  let cancelled = false;
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        try {
          for (const s of steps) {
            if (cancelled) return;
            send("step", s);
            await sleep(mockConfig.latency ? mockConfig.stepMs : 0, signal);
          }
          if (!cancelled) send(final.event, final.data);
          controller.close();
        } catch {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      },
      cancel() {
        cancelled = true;
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } },
  );
}

export const mockFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://mock.local");
  const path = url.pathname;
  const method = (init?.method ?? "GET").toUpperCase();
  const signal = init?.signal ?? undefined;

  await delay(signal);
  if (mockConfig.failNext) {
    mockConfig.failNext = false;
    return err(500, "internal_error");
  }

  if (method === "GET" && path === "/api/health") return json({ ok: true, voiceProvider: "browser", mocks: true });
  if (method === "GET" && path === "/api/credits") return json({ balance: mockState.balance, packs: PACKS });
  if (method === "GET" && path === "/api/demo-wallets") return json({ wallets: DEMO_WALLETS });

  if (method === "POST" && path === "/api/check") {
    const out = runCheck(await readBody(init));
    return json(out.body, out.status);
  }

  if (method === "POST" && path === "/api/check/stream") {
    const out = runCheck(await readBody(init));
    if (out.status !== 200 || !out.res) return json(out.body, out.status);
    const steps = out.res.cached ? STEPS.slice(0, 1) : STEPS;
    return sse(steps, { event: "result", data: out.res }, signal);
  }

  if (method === "POST" && path === "/api/transcribe") {
    // Mock mode cannot hear anything: it "recognises" the demo wallet. The provider is "browser", never a sponsor.
    return json({ text: "DEMO-ILLICIT-01", address: "DEMO-ILLICIT-01", provider: "browser" });
  }

  if (method === "POST" && path === "/api/checkout") {
    const body = (await readBody(init)) as { packId?: string };
    const pack = PACKS.find((p) => p.id === body?.packId);
    if (!pack) return err(404, "unknown_pack");
    mockState.balance += pack.credits;
    return json({ url: `/credits/success?mock=1&pack=${pack.id}` });
  }

  if (method === "POST" && path === "/api/crypto-invoice") {
    const body = (await readBody(init)) as { packId?: string; coin?: string };
    const pack = PACKS.find((p) => p.id === body?.packId);
    if (!pack) return err(404, "unknown_pack");
    const coin = body?.coin === "xmr" ? "xmr" : "btc";
    const invoiceId = `mock-${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = Date.now() + 15 * 60_000;
    mockState.invoices.set(invoiceId, { paid: false, credits: pack.credits, expiresAt });
    const amount = coin === "btc" ? (pack.priceUsd * 0.00001).toFixed(6) : (pack.priceUsd * 0.0001).toFixed(6);
    const address = coin === "btc" ? "DEMO-INVOICE-ADDRESS" : "DEMO-XMR-ADDRESS";
    const uri = coin === "btc" ? `bitcoin:${address}?amount=${amount}` : `monero:${address}?tx_amount=${amount}`;
    return json({ invoiceId, uri, address, amount, coin, expiresAt: new Date(expiresAt).toISOString(), provider: coin === "btc" ? "explorer" : "demo" });
  }

  const inv = path.match(/^\/api\/crypto-invoice\/([^/]+)$/);
  if (method === "GET" && inv) {
    const rec = mockState.invoices.get(decodeURIComponent(inv[1] as string));
    if (!rec) return err(404, "not_found");
    return json({ status: rec.paid ? "paid" : Date.now() > rec.expiresAt ? "expired" : "waiting" });
  }

  if (method === "GET" && path === "/api/benchmark") {
    if (!mockState.benchmark.done) return json({ status: "not_measured" });
    // Obviously fake sample numbers; the UI labels them "SAMPLE ONLY (mock)".
    return json({
      status: "ok",
      measuredAt: new Date().toISOString(),
      sampleSize: 25,
      rows: [
        { method: "raw_dump", inputTokens: 4000, latencyMs: 3000, accuracyPct: 80 },
        { method: "graph_evidence", inputTokens: 400, latencyMs: 300, accuracyPct: 88 },
      ],
      models: [
        { name: "baseline", illicitF1: 0.5, precision: 0.6, recall: 0.45 },
        { name: "with_graph_features", illicitF1: 0.52, precision: 0.62, recall: 0.47 },
      ],
    });
  }
  if (method === "POST" && path === "/api/benchmark/run") {
    mockState.benchmark = { startedAt: Date.now(), done: false };
    return json({ jobId: "mock-job" });
  }
  if (method === "GET" && path === "/api/benchmark/job/mock-job") {
    const started = mockState.benchmark.startedAt;
    if (started === null) return err(404, "not_found");
    const progress = Math.min(1, (Date.now() - started) / 4000);
    if (progress >= 1) mockState.benchmark.done = true;
    return json({ status: progress >= 1 ? "done" : "running", progress });
  }

  return err(404, "not_found");
};

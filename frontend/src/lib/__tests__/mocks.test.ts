import { beforeEach, describe, expect, it } from "vitest";
import { checkResponseSchema, createApiClient, streamCheck, verifyReportHash, ApiError } from "@/lib/api";
import { mockConfig, mockFetch, resetMockState, FIXTURES } from "@/lib/mocks";
import { keccak256, toUtf8Bytes } from "ethers";

const opts = { baseUrl: "", fetchImpl: mockFetch };
const api = createApiClient(opts);

beforeEach(() => {
  resetMockState();
  mockConfig.latency = false;
});

describe("mock fixtures", () => {
  it.each(Object.keys(FIXTURES))("%s is a valid CheckResponse with a verifiable reportHash", (key) => {
    const res = FIXTURES[key]!;
    expect(checkResponseSchema.safeParse(res).success).toBe(true);
    expect(verifyReportHash(res, (s) => keccak256(toUtf8Bytes(s)))).toBe(true);
    expect(res.isMock).toBe(true);
  });
  it("covers all four verdicts", () => {
    expect(new Set(Object.values(FIXTURES).map((f) => f.verdict))).toEqual(new Set(["ALLOW", "WARN", "BLOCK", "UNKNOWN"]));
  });
  it("subgraphs have 20-120 nodes for found wallets and a subject node", () => {
    for (const f of Object.values(FIXTURES).filter((x) => x.status === "ok")) {
      expect(f.subgraph.nodes.length).toBeGreaterThanOrEqual(20);
      expect(f.subgraph.nodes.length).toBeLessThanOrEqual(120);
      expect(f.subgraph.nodes.filter((n) => n.isSubject)).toHaveLength(1);
    }
  });
  it("BLOCK has an illicit node at the advertised distance", () => {
    const b = FIXTURES["DEMO-ILLICIT-01"]!;
    expect(b.subgraph.nodes.some((n) => n.label === "illicit" && n.hop === b.hopsToNearestIllicit)).toBe(true);
  });
});

describe("mock backend", () => {
  it("serves health, credits and demo wallets", async () => {
    expect((await api.health()).mocks).toBe(true);
    expect((await api.credits()).balance).toBe(3);
    expect((await api.demoWallets()).wallets).toHaveLength(4);
  });
  it("charges one credit per found wallet and caches repeats for free", async () => {
    const first = await api.check("DEMO-ILLICIT-01", "en");
    expect(first.creditsRemaining).toBe(2);
    const again = await api.check("DEMO-ILLICIT-01", "en");
    expect(again.cached).toBe(true);
    expect(again.creditsRemaining).toBe(2);
  });
  it("does not charge for wallets outside the dataset", async () => {
    const res = await api.check("DEMO-NOTFOUND-04", "en");
    expect(res.status).toBe("not_in_dataset");
    expect(res.creditsRemaining).toBe(3);
  });
  it("answers 402 no_credits at zero balance", async () => {
    await api.check("DEMO-ILLICIT-01", "en");
    await api.check("DEMO-BORDERLINE-03", "en");
    await api.check("DEMO-LICIT-02", "en");
    await expect(api.check("DEMO-LICIT-02", "hi")).rejects.toMatchObject({ status: 402, code: "no_credits" });
  });
  it("rejects secrets and bad addresses", async () => {
    await expect(api.check("a".repeat(64), "en")).rejects.toMatchObject({ code: "secret_input" });
    await expect(api.check("nope", "en")).rejects.toMatchObject({ code: "invalid_address" });
  });
  it("streams steps then the result", async () => {
    const steps: string[] = [];
    const res = await streamCheck(opts, "DEMO-LICIT-02", "en", { onStep: (s) => steps.push(s.id) });
    expect(steps).toEqual(["validate", "graph", "hops", "score", "explain"]);
    expect(res.verdict).toBe("ALLOW");
  });
  it("can fail the next request on demand", async () => {
    mockConfig.failNext = true;
    await expect(api.credits()).rejects.toBeInstanceOf(ApiError);
    expect((await api.credits()).balance).toBe(3);
  });
  it("runs the benchmark job and then reports numbers", async () => {
    expect((await api.benchmark()).status).toBe("not_measured");
    const { jobId } = await api.runBenchmark(25);
    expect((await api.benchmarkJob(jobId)).status).toBe("running");
  });
});

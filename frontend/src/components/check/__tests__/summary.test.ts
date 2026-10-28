import { describe, expect, it } from "vitest";
import { FIXTURES } from "@/lib/mocks";
import { pickDemoWallets } from "../DemoChips";
import { buildSummary, reportFileName } from "../summary";

describe("buildSummary", () => {
  it("includes verdict, score, hops and the limitation lines", () => {
    const s = buildSummary(FIXTURES["DEMO-ILLICIT-01"]!, "en");
    expect(s).toContain("Cryptiq: BLOCK for DEMO-ILLICIT-01");
    expect(s).toContain("Risk score: 91/100");
    expect(s).toContain("Nearest flagged wallet: 1 hops");
    expect(s).toContain("Risk signal, not an accusation.");
    expect(s).toContain("not the live blockchain");
  });
  it("handles wallets outside the dataset", () => {
    const s = buildSummary(FIXTURES["DEMO-NOTFOUND-04"]!, "en");
    expect(s).toContain("Risk score: not in the dataset");
    expect(s).not.toContain("Nearest flagged wallet");
  });
  it("can be written in Hindi", () => {
    expect(buildSummary(FIXTURES["DEMO-LICIT-02"]!, "hi")).toContain("जोखिम स्कोर: 8/100");
  });
});

describe("reportFileName", () => {
  it("uses the first 8 safe characters", () => {
    expect(reportFileName("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toBe("cryptiq-report-bc1qar0s.json");
    expect(reportFileName("DEMO-ILLICIT-01")).toBe("cryptiq-report-DEMOILLI.json");
    expect(reportFileName("")).toBe("cryptiq-report-wallet.json");
  });
});

describe("pickDemoWallets", () => {
  const w = (address: string, expected: "BLOCK" | "WARN" | "ALLOW" | "UNKNOWN") => ({ address, note: address, expected });
  it("takes one wallet per verdict first", () => {
    const picked = pickDemoWallets([w("b1", "BLOCK"), w("b2", "BLOCK"), w("b3", "BLOCK"), w("a1", "ALLOW")]);
    expect(picked.map((p) => p.address)).toEqual(["b1", "a1", "b2", "b3"]);
  });
  it("caps at four", () => {
    expect(pickDemoWallets(Array.from({ length: 9 }, (_, i) => w(`x${i}`, "BLOCK")))).toHaveLength(4);
  });
});

import { demoLabel } from "../DemoChips";

describe("demoLabel", () => {
  it("keeps short notes and compacts long ones", () => {
    expect(demoLabel({ address: "DEMO-w02271", note: "Known illicit (demo)", expected: "BLOCK" }, "BLOCK")).toBe("Known illicit (demo)");
    expect(demoLabel({ address: "DEMO-w02271", note: "Test-split wallet labelled illicit in the synthetic fixture", expected: "BLOCK" }, "BLOCK")).toBe("BLOCK · DEMO-w02271");
  });
});

import { describe, expect, it } from "vitest";
import { CHAIN, getWagmiConfig } from "../web3Config";

describe("web3Config", () => {
  it("is Base Sepolia only (84532, a test network)", () => {
    expect(CHAIN.id).toBe(84532);
    const config = getWagmiConfig();
    expect(config.chains.map((c) => c.id)).toEqual([84532]);
  });
  it("returns the same config object every time (shared by all wallet UI)", () => {
    expect(getWagmiConfig()).toBe(getWagmiConfig());
  });
});

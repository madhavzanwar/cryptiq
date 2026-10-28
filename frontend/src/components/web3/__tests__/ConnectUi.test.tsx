import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/lib/stores/settings";

const m = vi.hoisted(() => ({ state: {} as Record<string, unknown>, openChain: vi.fn(), openConnect: vi.fn(), openAccount: vi.fn() }));

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (p: Record<string, unknown>) => React.ReactNode }) =>
      children({ mounted: true, openChainModal: m.openChain, openConnectModal: m.openConnect, openAccountModal: m.openAccount, ...m.state }),
  },
}));
vi.mock("@/lib/web3Config", () => ({ HAS_WALLETCONNECT: true }));

import ConnectUi from "../ConnectUi";

beforeEach(() => useSettings.setState({ lang: "en" }));
afterEach(cleanup);

describe("ConnectUi (top-bar wallet button)", () => {
  it("disconnected: 'Connect wallet' opens the connect modal", async () => {
    m.state = { account: undefined, chain: undefined };
    render(<ConnectUi />);
    await userEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(m.openConnect).toHaveBeenCalled();
  });

  it("wrong network: shows 'Switch to Base Sepolia' and opens the chain modal", async () => {
    m.state = { account: { displayName: "0x12…5678" }, chain: { unsupported: true, id: 1 } };
    render(<ConnectUi />);
    await userEvent.click(screen.getByRole("button", { name: "Switch to Base Sepolia" }));
    expect(m.openChain).toHaveBeenCalled();
  });

  it("connected on Base Sepolia: shows the network badge and the short address", () => {
    m.state = { account: { displayName: "0x12…5678" }, chain: { unsupported: false, id: 84532 } };
    render(<ConnectUi />);
    expect(screen.getByText("Base Sepolia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wallet 0x12…5678/ })).toBeInTheDocument();
  });
});

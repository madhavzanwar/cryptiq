import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckResponse } from "@/lib/api/types";
import { fieldsFor, HashMismatchError } from "@/lib/eas/rules";
import { VerifyError } from "@/lib/eas/verify";
import { useSettings } from "@/lib/stores/settings";
import { useHistory } from "@/lib/stores/history";
import block from "@/lib/eas/__tests__/fixtures/real-check-block.json";

const RES = block as unknown as CheckResponse;
const ME = "0x1234567890abcdef1234567890abcdef12345678";
const UID = "0x" + "cd".repeat(32);
const TX = "0x" + "ef".repeat(32);

// ---- controllable mocks (hoisted so vi.mock factories can reach them) ----
const m = vi.hoisted(() => ({
  wallet: { address: undefined as string | undefined, chainId: undefined as number | undefined, isConnected: false },
  client: undefined as object | undefined,
  switchChainAsync: vi.fn(),
  openConnectModal: vi.fn(),
  submit: vi.fn(),
  fetchAttestation: vi.fn(),
  schema: "0x" + "55".repeat(32),
}));

vi.mock("wagmi", () => ({
  useAccount: () => m.wallet,
  useSwitchChain: () => ({ switchChainAsync: m.switchChainAsync, isPending: false }),
  useWalletClient: () => ({ data: m.client }),
}));
vi.mock("@rainbow-me/rainbowkit", () => ({ useConnectModal: () => ({ openConnectModal: m.openConnectModal }) }));
vi.mock("@/lib/web3Config", () => ({ CHAIN: { id: 84532 }, HAS_WALLETCONNECT: true }));
vi.mock("@/lib/env", async (orig) => ({
  ...(await orig<typeof import("@/lib/env")>()),
  get EAS_SCHEMA_UID() {
    return m.schema;
  },
}));
vi.mock("@/lib/eas/attest", () => ({ submitAttestation: m.submit }));
vi.mock("@/lib/eas/signer", () => ({ clientToSigner: () => ({}) }));
vi.mock("@/lib/eas/chain", () => ({ fetchAttestation: m.fetchAttestation }));

import AttestFlow from "../AttestFlow";

const connect = (chainId = 84532) => {
  m.wallet = { address: ME, chainId, isConnected: true };
  m.client = { account: { address: ME }, chain: { id: chainId } };
};

beforeEach(() => {
  useSettings.setState({ lang: "en" });
  m.wallet = { address: undefined, chainId: undefined, isConnected: false };
  m.client = undefined;
  m.schema = "0x" + "55".repeat(32);
  for (const f of [m.switchChainAsync, m.openConnectModal, m.submit, m.fetchAttestation]) f.mockReset();
});
afterEach(cleanup);

describe("AttestFlow states", () => {
  it("not connected: offers to connect (no create button)", async () => {
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Connect a wallet to continue" }));
    expect(m.openConnectModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Create attestation" })).toBeNull();
  });

  it("wrong chain: shows 'Switch to Base Sepolia' and calls switchChain with Base Sepolia (84532)", async () => {
    connect(1);
    m.switchChainAsync.mockResolvedValue(undefined);
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Switch to Base Sepolia" }));
    expect(m.switchChainAsync).toHaveBeenCalledWith({ chainId: 84532 });
  });

  it("switching network can be rejected and says so", async () => {
    connect(1);
    m.switchChainAsync.mockRejectedValue({ code: 4001, name: "UserRejectedRequestError" });
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Switch to Base Sepolia" }));
    expect(await screen.findByText(/You cancelled the request in your wallet/)).toBeInTheDocument();
  });

  it("no schema UID: setup message and a disabled create button", () => {
    connect();
    m.schema = "";
    render(<AttestFlow result={RES} />);
    expect(screen.getByText(/Attestations are not set up yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create attestation" })).toBeDisabled();
  });

  it("says 'Testnet attestation, not a legal verdict.' next to the permanence warning", () => {
    connect();
    render(<AttestFlow result={RES} />);
    expect(screen.getByText(/Attestations are public and permanent/)).toBeInTheDocument();
    expect(screen.getByText("Testnet attestation, not a legal verdict.")).toBeInTheDocument();
  });

  it("signs with the user's EVM address as recipient, then shows pending (tx link) and the easscan link", async () => {
    connect();
    let finish!: (uid: string) => void;
    m.submit.mockImplementation(
      (opts: { onSubmitted: (h: string) => void }) =>
        new Promise<string>((resolve) => {
          opts.onSubmitted(TX);
          finish = resolve;
        }),
    );
    useHistory.setState({ entries: [{ id: "h1", at: "2026-10-28T00:00:00Z", result: RES }] });
    render(<AttestFlow result={RES} historyId="h1" />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));

    await waitFor(() => expect(m.submit).toHaveBeenCalledTimes(1));
    expect(m.submit).toHaveBeenCalledWith(expect.objectContaining({ recipient: ME, schemaUid: m.schema, result: RES }));
    // pending: waiting for confirmation, with the BaseScan link to the sent transaction
    expect((await screen.findAllByText("Transaction sent. Waiting for confirmation…")).length).toBeGreaterThanOrEqual(1);
    const txLink = screen.getByRole("link", { name: /View transaction on BaseScan/ });
    expect(txLink).toHaveAttribute("href", `https://sepolia.basescan.org/tx/${TX}`);
    expect(screen.getByRole("button", { name: /Transaction sent/ })).toBeDisabled();

    await act(async () => finish(UID));
    const view = await screen.findByRole("link", { name: /View on easscan/ });
    expect(view).toHaveAttribute("href", `https://base-sepolia.easscan.org/attestation/view/${UID}`);
    expect(screen.getAllByText("Attestation created").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Testnet attestation, not a legal verdict.").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("link", { name: /View transaction on BaseScan/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Add to History" }));
    expect(useHistory.getState().entries[0]?.attestationUid).toBe(UID);
  });

  it("user rejection: friendly message, nothing sent", async () => {
    connect();
    m.submit.mockRejectedValue({ code: "ACTION_REJECTED", message: "user rejected action" });
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));
    expect(await screen.findByText(/You cancelled the request in your wallet. Nothing was sent./)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /easscan/ })).toBeNull();
  });

  it("low test ETH: says so and links to a Base Sepolia faucet list", async () => {
    connect();
    m.submit.mockRejectedValue(new Error("insufficient funds for intrinsic transaction cost"));
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));
    expect(await screen.findByText(/no Base Sepolia test ETH/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Base Sepolia faucets" })).toHaveAttribute("href", expect.stringContaining("faucet"));
  });

  it("wrong chain error from the wallet is mapped to the switch-network message", async () => {
    connect();
    m.submit.mockRejectedValue(new Error("The current chain of the wallet does not match the target chain"));
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));
    expect(await screen.findByText(/different network/)).toBeInTheDocument();
  });

  it("hash mismatch (page vs backend): explains it and disables create; submit is never called", async () => {
    connect();
    render(<AttestFlow result={{ ...RES, reportHash: "0x" + "99".repeat(32) }} />);
    expect(screen.getByText(/does not match the backend's hash, so nothing was sent/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create attestation" })).toBeDisabled();
    expect(m.submit).not.toHaveBeenCalled();
  });

  it("a HashMismatchError thrown by the submit step shows the same message", async () => {
    connect();
    m.submit.mockRejectedValue(new HashMismatchError("0xa", "0xb"));
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));
    expect(await screen.findByText(/does not match the backend's hash/)).toBeInTheDocument();
  });
});

describe("Verify button", () => {
  const verifyRegion = () => screen.getByRole("list");
  const lastList = () => within(screen.getAllByRole("list").at(-1) as HTMLElement);

  it("before attesting: recomputes the hash and shows Match (icon + word)", async () => {
    connect();
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    const row = lastList().getByText("Report hash: this page vs the backend").closest("li") as HTMLElement;
    expect(within(row).getByText("Match")).toBeInTheDocument();
    expect(row.querySelector("svg")).not.toBeNull();
    expect(m.fetchAttestation).not.toHaveBeenCalled(); // no UID yet, so no chain read
  });

  it("shows Mismatch when the backend hash is wrong", async () => {
    connect();
    render(<AttestFlow result={{ ...RES, reportHash: "0x" + "99".repeat(32) }} />);
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    const row = lastList().getByText("Report hash: this page vs the backend").closest("li") as HTMLElement;
    expect(within(row).getByText("Mismatch")).toBeInTheDocument();
  });

  it("shows 'Not available' (never Match) when the backend sent no hash", async () => {
    connect();
    render(<AttestFlow result={{ ...RES, reportHash: undefined }} />);
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(screen.getByText("The backend sent no report hash, so there is nothing to compare.")).toBeInTheDocument();
    expect(screen.queryByText("Match")).toBeNull();
  });

  async function attestThenVerify(chainData: ReturnType<typeof fieldsFor> | Error, revoked = false) {
    connect();
    m.submit.mockResolvedValue(UID);
    if (chainData instanceof Error) m.fetchAttestation.mockRejectedValue(chainData);
    else m.fetchAttestation.mockResolvedValue({ uid: UID, schema: m.schema, attester: ME, recipient: ME, revoked, fields: chainData });
    render(<AttestFlow result={RES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create attestation" }));
    await screen.findByRole("link", { name: /View on easscan/ });
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(m.fetchAttestation).toHaveBeenCalledWith(UID));
  }

  it("after attesting: reads the attestation from the chain and shows Match when everything agrees", async () => {
    await attestThenVerify(fieldsFor(RES, RES.reportHash as string));
    const row = (await screen.findByText("On-chain attestation vs this result")).closest("li") as HTMLElement;
    expect(within(row).getByText("Match")).toBeInTheDocument();
  });

  it("shows Mismatch and names the field when the on-chain verdict differs", async () => {
    await attestThenVerify({ ...fieldsFor(RES, RES.reportHash as string), verdict: "ALLOW" });
    const row = (await screen.findByText("On-chain attestation vs this result")).closest("li") as HTMLElement;
    expect(within(row).getByText("Mismatch")).toBeInTheDocument();
    expect(within(row).getByText("Different: verdict")).toBeInTheDocument();
  });

  it("RPC failure: 'Could not reach the network, try again.' and no Match for the chain row", async () => {
    await attestThenVerify(new VerifyError("network", "timeout"));
    const row = (await screen.findByText("On-chain attestation vs this result")).closest("li") as HTMLElement;
    expect(within(row).getByText("Could not reach the network, try again.")).toBeInTheDocument();
    expect(within(row).queryByText("Match")).toBeNull();
  });

  it("a revoked attestation shows Revoked, not Match", async () => {
    await attestThenVerify(fieldsFor(RES, RES.reportHash as string), true);
    const row = (await screen.findByText("On-chain attestation vs this result")).closest("li") as HTMLElement;
    expect(within(row).getByText("Revoked")).toBeInTheDocument();
  });

  it("the Hindi UI has Hindi labels for the same states", async () => {
    useSettings.setState({ lang: "hi" });
    connect();
    render(<AttestFlow result={RES} />);
    expect(screen.getByText("यह टेस्टनेट पर एक अटेस्टेशन है, कानूनी फ़ैसला नहीं।")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "जाँचें (Verify)" }));
    expect(screen.getAllByText("मेल खाता है").length).toBeGreaterThanOrEqual(1);
    void verifyRegion;
  });
});

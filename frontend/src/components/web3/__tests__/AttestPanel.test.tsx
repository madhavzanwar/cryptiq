import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIXTURES } from "@/lib/mocks";
import { useSettings } from "@/lib/stores/settings";

const BLOCK = FIXTURES["DEMO-ILLICIT-01"]!;
const UNKNOWN = FIXTURES["DEMO-NOTFOUND-04"]!;

beforeEach(() => {
  useSettings.setState({ lang: "en" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("AttestPanel", () => {
  it("explains why UNKNOWN / not_in_dataset results are not attested", async () => {
    const { AttestPanel } = await import("../AttestPanel");
    render(<AttestPanel result={UNKNOWN} />);
    expect(screen.getByText("Nothing to attest")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing for an error result", async () => {
    const { AttestPanel } = await import("../AttestPanel");
    const { container } = render(<AttestPanel result={{ ...BLOCK, status: "error" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("in mock mode runs a clearly labelled simulated flow with no link", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.resetModules();
    const { AttestPanel } = await import("../AttestPanel");
    const user = userEvent.setup();
    render(<AttestPanel result={BLOCK} />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText(/Attestations are public and permanent/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create attestation (simulated)" }));
    await waitFor(() => expect(screen.getByText(/Simulated attestation created/)).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows the four steps in order", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.resetModules();
    const { AttestPanel } = await import("../AttestPanel");
    render(<AttestPanel result={BLOCK} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Connect wallet")).toBeInTheDocument();
    expect(screen.getByText("Switch to Base Sepolia")).toBeInTheDocument();
    expect(screen.getByText("Sign")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

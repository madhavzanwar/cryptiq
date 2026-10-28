import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CheckResponse } from "@/lib/api/types";
import { FIXTURES } from "@/lib/mocks";
import { VerdictCard } from "../VerdictCard";

const block = FIXTURES["DEMO-ILLICIT-01"]!;
const allow = FIXTURES["DEMO-LICIT-02"]!;
const warn = FIXTURES["DEMO-BORDERLINE-03"]!;
const unknown = FIXTURES["DEMO-NOTFOUND-04"]!;
const with_ = (r: CheckResponse, patch: Partial<CheckResponse>): CheckResponse => ({ ...r, ...patch });

describe("VerdictCard wording rules", () => {
  it("ALLOW uses the honest line and never says 'safe'", () => {
    const { container } = render(<VerdictCard result={allow} />);
    expect(screen.getByText("No strong risk signals found in the dataset")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bsafe\b|guarantee/i);
  });
  it("shows icon + word for every verdict", () => {
    for (const [r, word] of [[block, "BLOCK"], [warn, "WARN"], [allow, "ALLOW"], [unknown, "UNKNOWN"]] as const) {
      const { unmount, container } = render(<VerdictCard result={r} />);
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });
  it("UNKNOWN says we can't say, shows n/a and no hops chip", () => {
    render(<VerdictCard result={unknown} />);
    expect(screen.getByText("This wallet isn't in our dataset, so we can't say")).toBeInTheDocument();
    expect(screen.getByText("n/a")).toBeInTheDocument();
    expect(screen.queryByText(/Nearest flagged wallet/)).toBeNull();
  });
  it("always carries both honesty lines", () => {
    render(<VerdictCard result={block} />);
    expect(screen.getByText(/Risk signal, not an accusation\./)).toBeInTheDocument();
    expect(screen.getByText(/research dataset of Bitcoin activity \(Elliptic\+\+\), not the live blockchain/)).toBeInTheDocument();
  });
});

describe("VerdictCard risk meter and chips", () => {
  it("exposes the score as role=meter with value text", () => {
    render(<VerdictCard result={block} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "91");
    expect(meter).toHaveAttribute("aria-valuetext", "91 out of 100");
  });
  it("shows OFAC match and the nearest-flagged chip for BLOCK", () => {
    render(<VerdictCard result={block} />);
    expect(screen.getByText("OFAC list: match")).toBeInTheDocument();
    expect(screen.getByText("Nearest flagged wallet: 1 hop")).toBeInTheDocument();
  });
  it("says 'none within 3 hops' when no flagged wallet is near", () => {
    render(<VerdictCard result={allow} />);
    expect(screen.getByText("Nearest flagged wallet: none within 3 hops")).toBeInTheDocument();
  });
});

describe("graph engine badge", () => {
  it("shows the TigerGraph badge only when engine is tigergraph, with Example on mock data", () => {
    render(<VerdictCard result={with_(block, { engine: "tigergraph", isMock: true })} />);
    const badge = screen.getByTestId("tigergraph-badge");
    expect(badge).toHaveTextContent(/answered by TigerGraph in \d+ ms/);
    expect(within(badge).getByText("Example")).toBeInTheDocument();
    expect(screen.getByText("View GSQL")).toBeInTheDocument();
  });
  it("never claims TigerGraph for NetworkX or replay", () => {
    const { unmount, container } = render(<VerdictCard result={with_(block, { engine: "networkx", isMock: false })} />);
    expect(screen.queryByTestId("tigergraph-badge")).toBeNull();
    expect(screen.getByTestId("engine-label")).toHaveTextContent(/NetworkX \(fallback\)/);
    expect(container.textContent).not.toMatch(/answered by TigerGraph/);
    unmount();
    render(<VerdictCard result={with_(block, { engine: "replay", replay: true })} />);
    expect(screen.queryByTestId("tigergraph-badge")).toBeNull();
    expect(screen.getByTestId("engine-label")).toHaveTextContent(/replay/i);
  });
  it("hides the GSQL toggle when the API sent no gsql", () => {
    render(<VerdictCard result={with_(block, { engine: "tigergraph", tigergraph: { queryName: "q", ms: 12 } })} />);
    expect(screen.queryByText("View GSQL")).toBeNull();
  });
});

describe("notices", () => {
  it("shows mock, replay, cached and truncated notices when set", () => {
    render(<VerdictCard result={with_(block, { isMock: true, replay: true, cached: true, truncated: true })} />);
    expect(screen.getByText("Synthetic or mock data: these are not real wallets.")).toBeInTheDocument();
    expect(screen.getByText("Replay: a saved response, not a live check.")).toBeInTheDocument();
    expect(screen.getByText("Cached, no credit used.")).toBeInTheDocument();
    expect(screen.getByText(/Results truncated/)).toBeInTheDocument();
  });
  it("shows none of them for a plain live result", () => {
    render(<VerdictCard result={with_(allow, { isMock: false, replay: false, cached: false, truncated: false })} />);
    expect(screen.queryByText(/Synthetic or mock/)).toBeNull();
    expect(screen.queryByText(/Cached, no credit/)).toBeNull();
  });
  it("verifies the report hash of an untouched fixture and flags a tampered one", () => {
    const { unmount } = render(<VerdictCard result={block} />);
    expect(screen.getByText("Report hash verified")).toBeInTheDocument();
    unmount();
    render(<VerdictCard result={with_(block, { riskScore: 12 })} />);
    expect(screen.getByText("Report hash does not match")).toBeInTheDocument();
  });
});

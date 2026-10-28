import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FIXTURES } from "@/lib/mocks";
import { useSettings } from "@/lib/stores/settings";
import { EvidenceGraph } from "../EvidenceGraph";
import { GraphLegend } from "../GraphLegend";
import { GraphList } from "../GraphList";

beforeEach(() => useSettings.setState({ lang: "en" }));
afterEach(cleanup);

describe("EvidenceGraph", () => {
  it("shows a friendly empty state when the wallet is not in the dataset", () => {
    render(<EvidenceGraph result={FIXTURES["DEMO-NOTFOUND-04"]!} />);
    expect(screen.getByText("No graph to show")).toBeInTheDocument();
  });
  it("speaks Hindi when the language is Hindi", () => {
    useSettings.setState({ lang: "hi" });
    render(<EvidenceGraph result={FIXTURES["DEMO-NOTFOUND-04"]!} />);
    expect(screen.getByText("दिखाने के लिए कोई ग्राफ नहीं")).toBeInTheDocument();
  });
});

describe("GraphLegend", () => {
  it("lists subject, the three labels and the arrow, in words (never colour alone)", () => {
    render(<GraphLegend />);
    for (const text of ["Checked wallet", "Illicit", "Licit", "Unknown", "Money direction"]) expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("GraphList (accessible alternative)", () => {
  it("is collapsed by default and lists every node when opened", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const nodes = FIXTURES["DEMO-LICIT-02"]!.subgraph.nodes;
    render(<GraphList nodes={nodes} />);
    const toggle = screen.getByRole("button", { name: /Graph as a list/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("row")).toHaveLength(nodes.length + 1);
    expect(screen.getByText("Checked wallet")).toBeInTheDocument();
  });
});

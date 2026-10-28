import type { CheckResponse } from "@/lib/api/types";
import { useHistory } from "@/lib/stores/history";
import { useSettings } from "@/lib/stores/settings";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { HistoryView } from "../HistoryView";

const result = (address: string, verdict: CheckResponse["verdict"], riskScore: number | null): CheckResponse => ({
  status: "ok", address, chain: "bitcoin", verdict, riskScore, datasetLabel: null, hopsToNearestIllicit: verdict === "BLOCK" ? 1 : null,
  neighbors: { hop1: { illicit: 0, licit: 0, unknown: 0 }, hop2: { illicit: 0, licit: 0, unknown: 0 } },
  graphFeatures: {}, labelHits: { ofac: false, ransomwhere: false }, topReasons: [], subgraph: { nodes: [], links: [] },
  tigergraph: { queryName: "q", ms: 1 }, model: { name: "m" }, explanation: { en: "", hi: "" }, limitations: [],
});

beforeEach(() => {
  localStorage.clear();
  useSettings.setState({ lang: "en", saveHistory: false });
  useHistory.setState({
    entries: [
      { id: "a", at: "2026-10-28T10:00:00Z", result: result("DEMO-LICIT-02", "ALLOW", 8) },
      { id: "b", at: "2026-10-28T12:00:00Z", result: result("DEMO-ILLICIT-01", "BLOCK", 91), attestationUid: "0xabc" },
    ],
  });
});

describe("HistoryView", () => {
  it("is off by default: explains it and shows an empty state, listing nothing", () => {
    render(<HistoryView />);
    expect(screen.getByRole("switch", { name: "Save my checks on this device" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("History is off")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("turning it on lists the checks, links to the permalink and to the attestation", async () => {
    render(<HistoryView />);
    await userEvent.click(screen.getByRole("switch", { name: "Save my checks on this device" }));
    expect(useSettings.getState().saveHistory).toBe(true);
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(3); // header + 2
    const open = within(table).getAllByRole("link", { name: "Open result" });
    expect(open.map((a) => a.getAttribute("href"))).toEqual(["/r/b", "/r/a"]); // newest first
    expect(within(table).getByRole("link", { name: "View attestation" })).toHaveAttribute("href", expect.stringContaining("/attestation/view/0xabc"));
  });

  it("filters by verdict and by address, and deletes one entry", async () => {
    useSettings.setState({ saveHistory: true });
    render(<HistoryView />);
    await userEvent.click(screen.getByRole("radio", { name: "BLOCK" }));
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    await userEvent.click(screen.getByRole("radio", { name: "All" }));
    await userEvent.type(screen.getByLabelText("Search by address"), "licit-02");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    await userEvent.click(within(screen.getByRole("table")).getByRole("button", { name: /Delete DEMO-LICIT-02/ }));
    expect(useHistory.getState().entries.map((e) => e.id)).toEqual(["b"]);
  });

  it("delete all asks first", async () => {
    useSettings.setState({ saveHistory: true });
    render(<HistoryView />);
    await userEvent.click(screen.getByRole("button", { name: "Delete all" }));
    expect(useHistory.getState().entries).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(useHistory.getState().entries).toHaveLength(0);
  });

  it("turning it off removes the saved copy from localStorage", async () => {
    useSettings.setState({ saveHistory: true });
    localStorage.setItem("cryptiq.history", "{}");
    render(<HistoryView />);
    await userEvent.click(screen.getByRole("switch", { name: "Save my checks on this device" }));
    expect(localStorage.getItem("cryptiq.history")).toBeNull();
  });
});

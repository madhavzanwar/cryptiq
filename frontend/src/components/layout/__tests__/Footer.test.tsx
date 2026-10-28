import { useSettings } from "@/lib/stores/settings";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const health = vi.hoisted(() => ({ data: undefined as undefined | { voiceProvider: string; mocks?: boolean } }));
vi.mock("@/lib/hooks/useApi", () => ({ useHealth: () => ({ data: health.data }) }));

import { Footer } from "../Footer";

beforeEach(() => {
  useSettings.setState({ lang: "en" });
  health.data = { voiceProvider: "browser" };
});

describe("Footer", () => {
  it("always shows the honesty line", () => {
    render(<Footer />);
    expect(screen.getByText("Risk signal, not an accusation. Research dataset, not the live blockchain.")).toBeInTheDocument();
  });
  it("shows the honesty line in Hindi too", () => {
    useSettings.setState({ lang: "hi" });
    render(<Footer />);
    expect(screen.getByText(/जोखिम का संकेत, आरोप नहीं/)).toBeInTheDocument();
  });
  it("lists only technology that is really used under 'Built with'", () => {
    render(<Footer />);
    for (const name of ["TigerGraph", "Dodo Payments (test mode)", "Cake Wallet (payment links)", "Base Sepolia + EAS"]) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.queryByText(/Wispr/)).not.toBeInTheDocument();
  });
  it("adds Wispr Flow only when the API reports it as the active voice provider", () => {
    health.data = { voiceProvider: "wispr" };
    render(<Footer />);
    expect(screen.getByText(/Wispr Flow/)).toBeInTheDocument();
  });
  it("thanks the community partners with plain text and links to about, credits, privacy and GitHub", () => {
    render(<Footer />);
    for (const name of ["AI Grants India", "Socket Security", "Edge City"]) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Credits" })).toHaveAttribute("href", "/credits");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", expect.stringContaining("github.com"));
    expect(screen.getByRole("link", { name: "Open-source credits" })).toHaveAttribute("href", "/about#credits");
    expect(document.querySelectorAll("footer img").length).toBe(0);
  });
});

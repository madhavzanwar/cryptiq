import { useSettings } from "@/lib/stores/settings";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LandingSections } from "../LandingSections";

beforeEach(() => useSettings.setState({ lang: "en" }));

describe("LandingSections", () => {
  it("renders the six sections with headings", () => {
    render(<LandingSections />);
    for (const name of [/crypto payments are final/i, /four steps, one answer/i, /more than a number behind a paywall/i, /technology behind each answer/i, /honest limits/i, /say a wallet\. see why/i]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });
  it("shows the three problems, four steps and the honest limits without invented statistics", () => {
    const { container } = render(<LandingSections />);
    expect(screen.getByText("Payments are final")).toBeInTheDocument();
    expect(screen.getByText("Scores without reasons")).toBeInTheDocument();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(screen.getByText(/not the live blockchain/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\d+\s?%/);
  });
  it("reveals content immediately when IntersectionObserver is unavailable", () => {
    const { container } = render(<LandingSections />);
    const targets = container.querySelectorAll("[data-reveal]");
    expect(targets.length).toBeGreaterThan(5);
    targets.forEach((t) => expect(t).toHaveClass("in"));
  });
  it("final CTA links to /check and to the limits", () => {
    render(<LandingSections />);
    expect(screen.getByRole("link", { name: "Try a check" })).toHaveAttribute("href", "/check");
    expect(screen.getByRole("link", { name: "Read the limits" })).toHaveAttribute("href", "/about#limits");
  });
});

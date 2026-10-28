import { useSettings } from "@/lib/stores/settings";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollStory } from "../ScrollStory";

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    onchange: null,
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  useSettings.setState({ lang: "en", reduceMotion: false });
  stubMatchMedia(false);
});
afterEach(() => vi.unstubAllGlobals());

describe("ScrollStory", () => {
  it("has a real h1 with both hero lines and the green CTA linking to /check", () => {
    render(<ScrollStory />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Say a wallet.Get a verdict.");
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/check");
  });

  it("labels everything inside the device as example data and hides the device from assistive tech", () => {
    const { container } = render(<ScrollStory />);
    const device = container.querySelector('[data-s="device"]');
    expect(device).toHaveAttribute("aria-hidden", "true");
    expect(device?.textContent).toContain("Example · mock data");
  });

  it("starts the engine on mount and removes it on unmount (pinned mode)", async () => {
    const { container, unmount } = render(<ScrollStory />);
    const track = container.querySelector("[data-story-track]") as HTMLElement;
    await act(async () => undefined);
    expect(track.dataset.ready).toBe("1");
    expect(track).not.toHaveAttribute("data-static");
    unmount();
    expect(track.dataset.ready).toBeUndefined();
  });

  it("renders the static stacked layout and never starts the engine when reduced motion is on", async () => {
    stubMatchMedia(true);
    const { container } = render(<ScrollStory />);
    const track = container.querySelector("[data-story-track]") as HTMLElement;
    await act(async () => undefined);
    expect(track).toHaveAttribute("data-static");
    expect(track.dataset.ready).toBeUndefined();
  });

  it("also goes static when 'reduce motion' is switched on in Settings", async () => {
    useSettings.setState({ reduceMotion: true });
    const { container } = render(<ScrollStory />);
    expect(container.querySelector("[data-story-track]")).toHaveAttribute("data-static");
  });

  it("renders in Hindi", () => {
    useSettings.setState({ lang: "hi" });
    render(<ScrollStory />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("वॉलेट बोलें।");
  });
});

import { useSettings } from "@/lib/stores/settings";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hooks/useApi", () => ({ useCreditsQuery: () => ({ data: undefined }), useHealth: () => ({ data: undefined }) }));

import { TopBar } from "../TopBar";

beforeEach(() => useSettings.setState({ lang: "en" }));

describe("TopBar", () => {
  it("has the logo mark only (no wordmark) linking home, plus language, credits and connect", () => {
    render(<TopBar />);
    const home = screen.getByRole("link", { name: "Cryptiq home" });
    expect(home).toHaveAttribute("href", "/");
    expect(home.textContent).toBe("");
    expect(home.querySelector("img")).toHaveAttribute("src", "/brand/logo-mark.svg");
    expect(home.querySelector("source")).toHaveAttribute("srcset", "/brand/logo-mark-static.svg");
    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Credits" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });
  it("is a solid sticky bar on ordinary pages", () => {
    render(<TopBar />);
    expect(screen.getByRole("banner")).toHaveAttribute("data-solid");
    expect(screen.getByRole("banner").className).toContain("sticky");
  });
  it("floats over the landing page (fixed) and is solid when there is no story on screen", () => {
    render(<TopBar overlay />);
    expect(screen.getByRole("banner").className).toContain("fixed");
    expect(screen.getByRole("banner")).toHaveAttribute("data-solid");
  });
  it("overflow menu offers History, Settings, Stage mode and GitHub", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<TopBar />);
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menuitem", { name: "History" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("menuitem", { name: "Stage mode" })).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("menuitem", { name: "GitHub" })).toHaveAttribute("href", expect.stringContaining("github.com"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem", { name: "History" })).not.toBeInTheDocument();
  });
});

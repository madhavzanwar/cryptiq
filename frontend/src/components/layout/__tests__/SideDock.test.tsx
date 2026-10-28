import { useUi } from "@/lib/stores/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/benchmark" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

import { SideDock } from "../SideDock";

const launcher = () => screen.getByRole("button", { name: /open menu|close menu/i });

beforeEach(() => {
  pathname.value = "/benchmark";
  useUi.setState({ dockOpen: false });
});

describe("SideDock", () => {
  it("is collapsed at first: the launcher is closed and the four destinations are inert", () => {
    render(<SideDock />);
    expect(launcher()).toHaveAttribute("aria-expanded", "false");
    expect(launcher()).toHaveAttribute("aria-controls", "dock-menu");
    expect(document.getElementById("dock-menu")).toHaveAttribute("inert");
  });

  it("lists Check, Benchmark, Credits and About with the current page marked", async () => {
    render(<SideDock />);
    await userEvent.click(launcher());
    expect(launcher()).toHaveAttribute("aria-expanded", "true");
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Check", "Benchmark", "Credits", "About"]);
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/check", "/benchmark", "/credits", "/about"]);
    expect(screen.getByRole("link", { name: "Benchmark" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Check" })).not.toHaveAttribute("aria-current");
  });

  it("marks sub-routes of a destination as current", () => {
    pathname.value = "/credits/success";
    render(<SideDock />);
    expect(screen.getByRole("link", { name: "Credits" })).toHaveAttribute("aria-current", "page");
  });

  it("closes on Escape and returns focus to the launcher", async () => {
    render(<SideDock />);
    await userEvent.click(launcher());
    screen.getByRole("link", { name: "Check" }).focus();
    await userEvent.keyboard("{Escape}");
    expect(launcher()).toHaveAttribute("aria-expanded", "false");
    expect(launcher()).toHaveFocus();
  });

  it("closes on an outside click but not on a click inside", async () => {
    render(<SideDock />);
    await userEvent.click(launcher());
    fireEvent.pointerDown(screen.getByRole("link", { name: "About" }));
    expect(launcher()).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(launcher()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when a destination is chosen", async () => {
    render(<SideDock />);
    await userEvent.click(launcher());
    await userEvent.click(screen.getByRole("link", { name: "Credits" }));
    expect(launcher()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with ArrowDown from the launcher and moves with the arrow, Home and End keys", async () => {
    render(<SideDock />);
    launcher().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(launcher()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Check" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Benchmark" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("link", { name: "About" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Check" })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("link", { name: "About" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("link", { name: "Check" })).toHaveFocus();
  });
});

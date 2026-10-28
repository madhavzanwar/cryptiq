import { useCredits } from "@/lib/stores/credits";
import { useSettings } from "@/lib/stores/settings";
import { useUi } from "@/lib/stores/ui";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CreditPill } from "../CreditPill";

beforeEach(() => {
  useSettings.setState({ lang: "en" });
  useCredits.setState({ balance: 5, tick: 0, activity: [] });
  useUi.setState({ creditsOpen: false });
});

describe("CreditPill", () => {
  it("shows the balance with an accessible label and no top-up state when credits are fine", () => {
    render(<CreditPill />);
    const pill = screen.getByRole("button", { name: "5 credits left" });
    expect(pill).toHaveTextContent("5");
    expect(pill).not.toHaveAttribute("data-low");
    expect(screen.queryByText("Top up")).not.toBeInTheDocument();
  });

  it.each([1, 0])("switches to the Top up state at %i credit(s)", (n) => {
    useCredits.setState({ balance: n });
    render(<CreditPill />);
    expect(screen.getByRole("button")).toHaveAttribute("data-low");
    expect(screen.getByText("Top up")).toBeInTheDocument();
  });

  it("shows a dash until the balance is known", () => {
    useCredits.setState({ balance: null });
    render(<CreditPill />);
    expect(screen.getByRole("button", { name: "Credits" })).toHaveTextContent("–");
  });

  it("plays the tick animation class only after the balance has gone down", () => {
    render(<CreditPill />);
    expect(screen.getByRole("button")).not.toHaveClass("tick");
    act(() => {
      useCredits.setState({ balance: 4, tick: 1 });
    });
    expect(screen.getByRole("button")).toHaveClass("tick");
    expect(screen.getByRole("button")).toHaveTextContent("4");
  });

  it("opens the credits drawer when clicked", async () => {
    render(<CreditPill />);
    await userEvent.click(screen.getByRole("button"));
    expect(useUi.getState().creditsOpen).toBe(true);
  });

  it("is labelled in Hindi", () => {
    useSettings.setState({ lang: "hi" });
    render(<CreditPill />);
    expect(screen.getByRole("button", { name: "5 क्रेडिट बाकी" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "../Toggle";

describe("Toggle", () => {
  it("is a labelled switch that reports changes", async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Save my checks" help="Stored on this device only" />);
    const sw = screen.getByRole("switch", { name: "Save my checks" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAccessibleDescription("Stored on this device only");
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it("reflects the checked state", () => {
    render(<Toggle checked onChange={() => undefined} label="On" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});

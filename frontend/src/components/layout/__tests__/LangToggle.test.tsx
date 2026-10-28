import { useSettings } from "@/lib/stores/settings";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LangToggle } from "../LangToggle";

beforeEach(() => useSettings.setState({ lang: "en" }));

describe("LangToggle", () => {
  it("shows EN | हिं with English selected", () => {
    render(<LangToggle />);
    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "हिन्दी" })).not.toBeChecked();
  });
  it("switches the interface language in the settings store and back", async () => {
    render(<LangToggle />);
    await userEvent.click(screen.getByRole("radio", { name: "हिन्दी" }));
    expect(useSettings.getState().lang).toBe("hi");
    expect(screen.getByRole("radio", { name: "हिन्दी" })).toBeChecked();
    expect(screen.getByRole("radiogroup", { name: "भाषा" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(useSettings.getState().lang).toBe("en");
  });
});

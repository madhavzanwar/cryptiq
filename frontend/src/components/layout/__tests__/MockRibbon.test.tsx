import { useSettings } from "@/lib/stores/settings";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ mocks: false, health: undefined as undefined | { mocks?: boolean } }));
vi.mock("@/lib/env", async (orig) => ({ ...(await orig<typeof import("@/lib/env")>()), get USE_MOCKS() { return state.mocks; } }));
vi.mock("@/lib/hooks/useApi", () => ({ useHealth: () => ({ data: state.health }) }));

import { MockRibbon } from "../MockRibbon";

beforeEach(() => {
  useSettings.setState({ lang: "en" });
  state.mocks = false;
  state.health = undefined;
});

describe("MockRibbon", () => {
  it("says MOCK DATA with the built-in mocks", () => {
    state.mocks = true;
    render(<MockRibbon />);
    expect(screen.getByRole("status")).toHaveTextContent("MOCK DATA");
  });
  it("says SYNTHETIC DATA when the backend reports it runs on its fixture", () => {
    state.health = { mocks: true };
    render(<MockRibbon />);
    expect(screen.getByRole("status")).toHaveTextContent("SYNTHETIC DATA");
  });
  it("shows nothing on real data", () => {
    state.health = { mocks: false };
    const { container } = render(<MockRibbon />);
    expect(container).toBeEmptyDOMElement();
  });
});

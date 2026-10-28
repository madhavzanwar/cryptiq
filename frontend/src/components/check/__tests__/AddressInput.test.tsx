import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AddressInput } from "../AddressInput";

const BECH = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const SEED = "legal winner thank year wave sausage worth useful legal winner thank yellow";

function Harness({ allowDemo = false, onSecret = () => undefined, initial = "" }: { allowDemo?: boolean; onSecret?: () => void; initial?: string }) {
  const [v, setV] = useState(initial);
  return <AddressInput value={v} onChange={setV} onSecret={onSecret} allowDemo={allowDemo} />;
}

describe("AddressInput", () => {
  it("shows the safety line when empty", () => {
    render(<Harness />);
    expect(screen.getByText(/Enter only a public address/)).toBeInTheDocument();
  });

  it("says 'format looks valid' (not 'verified') for a good address and counts characters", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText("Wallet address"), BECH);
    expect(screen.getByText("Format looks valid")).toBeInTheDocument();
    expect(screen.getByText(`${BECH.length} characters`)).toBeInTheDocument();
  });

  it("flags a malformed address with aria-invalid and a message", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Wallet address");
    await userEvent.type(input, "not-an-address");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("That does not look like a Bitcoin address.")).toBeInTheDocument();
  });

  it("accepts DEMO- placeholders only when allowed", async () => {
    const { unmount } = render(<Harness />);
    await userEvent.type(screen.getByLabelText("Wallet address"), "DEMO-ILLICIT-01");
    expect(screen.getByLabelText("Wallet address")).toHaveAttribute("aria-invalid", "true");
    unmount();
    render(<Harness allowDemo />);
    await userEvent.type(screen.getByLabelText("Wallet address"), "DEMO-ILLICIT-01");
    expect(screen.getByLabelText("Wallet address")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("Demo address")).toBeInTheDocument();
  });

  it("clears the field and calls onSecret when a seed phrase is pasted", async () => {
    const onSecret = vi.fn();
    render(<Harness onSecret={onSecret} />);
    const input = screen.getByLabelText("Wallet address");
    input.focus();
    await userEvent.paste(SEED);
    expect(onSecret).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("");
  });

  it("clears the field when a 64-hex private key is typed in one go", async () => {
    const onSecret = vi.fn();
    render(<Harness onSecret={onSecret} />);
    const input = screen.getByLabelText("Wallet address");
    await userEvent.click(input);
    await userEvent.paste("a".repeat(64));
    expect(onSecret).toHaveBeenCalled();
    expect(input).toHaveValue("");
  });

  it("has a clear button that empties the field", async () => {
    render(<Harness initial={BECH} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Wallet address")).toHaveValue("");
  });
});

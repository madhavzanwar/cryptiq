import { renderWithQuery } from "@/components/pages/__tests__/renderWithQuery";
import type { CryptoInvoice as Invoice } from "@/lib/api/types";
import { useCredits } from "@/lib/stores/credits";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  credits: vi.fn(),
  checkout: vi.fn(),
  createInvoice: vi.fn(),
  invoiceStatus: vi.fn(),
}));
vi.mock("@/lib/api/instance", () => ({ api }));

import { CreditsContent } from "../CreditsContent";
import { InvoiceCard } from "../InvoiceCard";

const packs = [
  { id: "starter", credits: 10, priceUsd: 1, label: "Starter" },
  { id: "plus", credits: 50, priceUsd: 4, label: "Plus" },
];
const invoice: Invoice = { invoiceId: "inv1", uri: "bitcoin:DEMO-ADDR?amount=0.0004", address: "DEMO-ADDR", amount: "0.000400", coin: "btc", expiresAt: new Date(Date.now() + 600_000).toISOString(), provider: "explorer" };

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  api.credits.mockResolvedValue({ balance: 3, packs });
  useCredits.setState({ balance: null, activity: [], tick: 0 });
});

describe("CreditsContent", () => {
  it("shows the balance and packs, and selecting a pack marks it pressed", async () => {
    renderWithQuery(<CreditsContent />);
    const plus = await screen.findByRole("button", { name: /Plus: 50 credits for \$4\.00/ });
    expect(screen.getAllByText("Test mode, no real charge")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Starter: 10 credits/ })).toHaveAttribute("aria-pressed", "true"); // first pack by default
    await userEvent.click(plus);
    expect(plus).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("Plus: 50 credits for $4.00")).toBeInTheDocument();
  });

  it("sends the selected pack to checkout and goes to the returned URL", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, assign } });
    api.checkout.mockResolvedValue({ url: "https://checkout.example/test" });
    renderWithQuery(<CreditsContent />);
    await userEvent.click(await screen.findByRole("button", { name: /Plus: 50 credits/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue to checkout" }));
    await waitFor(() => expect(api.checkout.mock.calls[0]?.[0]).toBe("plus"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.example/test"));
  });

  it("explains a payments outage instead of failing silently", async () => {
    const { ApiError } = await import("@/lib/api/errors");
    api.checkout.mockRejectedValue(new ApiError({ status: 503, code: "payments_unavailable" }));
    renderWithQuery(<CreditsContent />);
    await userEvent.click(await screen.findByRole("button", { name: "Continue to checkout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Payments are not available right now");
  });

  it("creates a crypto invoice and credits the balance once it is paid", async () => {
    api.createInvoice.mockResolvedValue(invoice);
    api.invoiceStatus.mockResolvedValue({ status: "paid" });
    renderWithQuery(<CreditsContent />);
    await screen.findByRole("button", { name: /Starter/ });
    await userEvent.click(screen.getByRole("tab", { name: /Pay privately with crypto/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create invoice" }));
    expect(api.createInvoice.mock.calls[0]).toEqual(["starter", "btc"]);
    expect(await screen.findByText("Paid. Credits added.")).toBeInTheDocument();
    await waitFor(() => expect(useCredits.getState().activity[0]).toMatchObject({ kind: "topup", delta: 10 }));
    expect(useCredits.getState().activity.filter((a) => a.kind === "topup")).toHaveLength(1); // credited exactly once
  });
});

describe("InvoiceCard", () => {
  const base = { invoice, remaining: 754, onNew: () => undefined };

  it("waiting: shows the QR, the link, the countdown and an open-in-wallet link", () => {
    renderWithQuery(<InvoiceCard {...base} status="waiting" />);
    expect(screen.getByRole("img", { name: "QR code for the payment link" })).toBeInTheDocument();
    expect(screen.getByText("Waiting for payment")).toBeInTheDocument();
    expect(screen.getByText("Expires in 12:34")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open in wallet" })).toHaveAttribute("href", invoice.uri);
    expect(screen.getByText("Scan with Cake Wallet or any compatible wallet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Simulate payment/ })).toBeNull();
  });

  it("offers the dev-only simulate button only when asked to", () => {
    renderWithQuery(<InvoiceCard {...base} status="waiting" onSimulate={() => undefined} />);
    expect(screen.getByRole("button", { name: "Simulate payment (dev only)" })).toBeInTheDocument();
  });

  it("paid and expired: no payment link, expired offers a new invoice", () => {
    const { unmount } = renderWithQuery(<InvoiceCard {...base} status="paid" />);
    expect(screen.getByText("Paid. Credits added.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open in wallet" })).toBeNull();
    unmount();
    renderWithQuery(<InvoiceCard {...base} status="expired" remaining={0} />);
    expect(screen.getByText("This invoice has expired.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a new invoice" })).toBeInTheDocument();
  });

  it("says Monero is not confirmed automatically in the demo", () => {
    renderWithQuery(<InvoiceCard {...base} invoice={{ ...invoice, coin: "xmr", provider: "demo" }} status="waiting" />);
    expect(screen.getByText("Monero payments are not confirmed automatically in this demo.")).toBeInTheDocument();
  });
});

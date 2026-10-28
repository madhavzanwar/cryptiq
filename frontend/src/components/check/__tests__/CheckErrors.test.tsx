import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckExperience } from "@/components/check/CheckExperience";
import { useUi } from "@/lib/stores/ui";
import { useSettings } from "@/lib/stores/settings";
import { useCredits } from "@/lib/stores/credits";
import { translate } from "@/lib/i18n";

vi.mock("@/components/graph/EvidenceGraph", () => ({ EvidenceGraph: () => null }));
vi.mock("@/components/web3/AttestPanel", () => ({ AttestPanel: () => null }));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const ADDR = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

/** Routes the page's own requests; `check` decides what /api/check/stream and /api/check answer. */
function stubBackend(check: () => Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) return json({ ok: true, voiceProvider: "browser" });
      if (url.includes("/api/credits")) return json({ balance: 3, packs: [] });
      if (url.includes("/api/demo-wallets")) return json({ wallets: [] });
      if (url.includes("/api/check")) return check();
      return json({ error: "not_found" }, 404);
    }),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CheckExperience />
    </QueryClientProvider>,
  );
}

async function submit(address = ADDR, label: RegExp | string = /wallet address/i) {
  renderPage();
  const user = userEvent.setup();
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, address);
  await user.click(screen.getByRole("button", { name: label === "Wallet address" || label instanceof RegExp ? /check wallet/i : /वॉलेट जाँचें/ }));
  return { user, field };
}

beforeEach(() => {
  useUi.setState({ creditsOpen: false });
  useCredits.setState({ balance: 3 });
  useSettings.setState({ lang: "en" });
});
afterEach(() => vi.unstubAllGlobals());

describe("check page shows friendly errors", () => {
  it("invalid_address: inline message, nothing charged", async () => {
    stubBackend(async () => json({ error: "invalid_address" }, 400));
    await submit();
    expect(await screen.findByText(/does not look like a valid bitcoin address/i)).toBeInTheDocument();
  });

  it("secret_input from the server: the warning shows and the field is cleared", async () => {
    stubBackend(async () => json({ error: "secret_input" }, 400));
    const { field } = await submit();
    expect(await screen.findByText(/secret key or seed phrase/i)).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("no_credits (402) opens the credits drawer", async () => {
    stubBackend(async () => json({ error: "no_credits" }, 402));
    await submit();
    await waitFor(() => expect(useUi.getState().creditsOpen).toBe(true));
  });

  it.each([
    ["rate_limited", () => json({ error: "rate_limited" }, 429), /too many requests/i],
    ["internal_error", () => json({ error: "internal_error" }, 500), /went wrong on our side/i],
    ["network failure", () => Promise.reject(new TypeError("Failed to fetch")), /could not reach cryptiq/i],
  ] as const)("%s: an alert with a Try again button", async (_n, make, text) => {
    stubBackend(async () => make());
    await submit();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows the same errors in Hindi (rate_limited)", async () => {
    useSettings.setState({ lang: "hi" });
    stubBackend(async () => json({ error: "rate_limited" }, 429));
    await submit(ADDR, translate("hi", "check.input.label"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/[\u0900-\u097F]/);
    expect(alert).toHaveTextContent(/बहुत ज़्यादा अनुरोध/);
    expect(screen.getByRole("button", { name: translate("hi", "action.retry") })).toBeInTheDocument();
  });
});

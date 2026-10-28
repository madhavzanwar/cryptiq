/** In-memory state of the fake backend, plus switches the dev tools / tests can flip. */
export const mockConfig = {
  /** Simulated network delay (400-1400 ms). Tests turn it off. */
  latency: true,
  /** Next request fails with a 500 (set by the dev-only "fail next request" switch). */
  failNext: false,
  /** Milliseconds between SSE progress steps. */
  stepMs: 280,
};

interface MockState {
  balance: number;
  cache: Map<string, { at: number; res: unknown }>;
  invoices: Map<string, { paid: boolean; credits: number; expiresAt: number }>;
  benchmark: { startedAt: number | null; done: boolean };
}

const fresh = (): MockState => ({
  balance: 3,
  cache: new Map(),
  invoices: new Map(),
  benchmark: { startedAt: null, done: false },
});

export let mockState: MockState = fresh();

export function resetMockState(): void {
  mockState = fresh();
  mockConfig.failNext = false;
}

/** Used by the dev-only "Simulate payment" button on the crypto tab. */
export function simulatePayment(invoiceId: string): void {
  const inv = mockState.invoices.get(invoiceId);
  if (inv && !inv.paid) {
    inv.paid = true;
    mockState.balance += inv.credits;
  }
}

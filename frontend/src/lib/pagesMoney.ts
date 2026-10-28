const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** 4 -> "$4.00". Prices come from the API as numbers (priceUsd). */
export function formatUsd(amount: number): string {
  return usd.format(amount);
}

/** Credits used this session (sum of the negative entries) and the share of "used / (used + left)". */
export function usageShare(activity: { delta: number }[], balance: number | null): { used: number; total: number; pct: number } {
  const used = activity.reduce((sum, a) => (a.delta < 0 ? sum - a.delta : sum), 0);
  const total = used + Math.max(0, balance ?? 0);
  return { used, total, pct: total === 0 ? 0 : Math.round((used / total) * 100) };
}

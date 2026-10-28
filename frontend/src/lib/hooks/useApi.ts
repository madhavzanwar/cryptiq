"use client";

import { api } from "@/lib/api/instance";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCredits } from "@/lib/stores/credits";

/** GET /api/health: which voice provider is active, whether the backend runs on the fixture, diagnostics. */
export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: ({ signal }) => api.health({ signal }), staleTime: 60_000, retry: 1 });
}

/** GET /api/credits: packs + balance. Also mirrors the balance into the credits store (top-bar pill). */
export function useCreditsQuery() {
  const setBalance = useCredits((s) => s.setBalance);
  const q = useQuery({ queryKey: ["credits"], queryFn: ({ signal }) => api.credits({ signal }), staleTime: 15_000 });
  useEffect(() => {
    if (q.data) setBalance(q.data.balance);
  }, [q.data, setBalance]);
  return q;
}

/** GET /api/demo-wallets: drawn from the held-out test split by the backend. */
export function useDemoWallets() {
  return useQuery({ queryKey: ["demo-wallets"], queryFn: ({ signal }) => api.demoWallets({ signal }), staleTime: 5 * 60_000 });
}

/** GET /api/benchmark: `not_measured` or measured numbers (never invented by the UI). */
export function useBenchmark() {
  return useQuery({ queryKey: ["benchmark"], queryFn: ({ signal }) => api.benchmark({ signal }), staleTime: 30_000 });
}

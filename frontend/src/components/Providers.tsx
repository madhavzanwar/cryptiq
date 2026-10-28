"use client";

import { LangSync } from "@/lib/i18n/provider";
import { useHistory } from "@/lib/stores/history";
import { useSettings } from "@/lib/stores/settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "./ui/Toaster";
import { Web3Provider } from "./web3/Web3Provider";

/** Client-side providers: data cache, wallet (Base Sepolia), language sync, toasts. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  // Persisted stores are hydrated after mount so the first client render matches the server HTML.
  useEffect(() => {
    void Promise.resolve(useSettings.persist.rehydrate()).then(() => useHistory.persist.rehydrate());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <LangSync />
        {children}
        <Toaster />
      </Web3Provider>
    </QueryClientProvider>
  );
}

"use client";

import { ErrorView } from "@/components/pages/ErrorView";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />;
}

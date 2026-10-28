"use client";

/** STUB (owned by the pages agent): global error boundary. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page section-gap">
      <h1 className="h-md">Something went wrong</h1>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}

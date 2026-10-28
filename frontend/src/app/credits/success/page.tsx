import { CreditsSuccess } from "@/components/credits/CreditsSuccess";
import { Suspense } from "react";

export const metadata = { title: "Credits added" };

export default function Page() {
  // useSearchParams needs a Suspense boundary so the page can still be prerendered
  return (
    <Suspense>
      <CreditsSuccess />
    </Suspense>
  );
}

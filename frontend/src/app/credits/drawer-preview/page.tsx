"use client";

import { CreditsDrawer } from "@/components/credits/CreditsDrawer";
import { useUi } from "@/lib/stores/ui";
import { useEffect } from "react";

/** TEMPORARY preview of the credits drawer (removed before handing over). */
export default function Page() {
  useEffect(() => useUi.getState().openCredits(), []);
  return <CreditsDrawer />;
}

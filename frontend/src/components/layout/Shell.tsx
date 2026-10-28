"use client";

import { CreditsDrawer } from "@/components/credits/CreditsDrawer";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { MockRibbon } from "./MockRibbon";
import { SideDock } from "./SideDock";
import { SkipLink } from "./SkipLink";
import { TopBar } from "./TopBar";

/**
 * App shell: skip link, top bar, side dock, content, footer, mock ribbon and the credits drawer.
 * Stage mode (/demo) renders only the content (plus the ribbon and drawer): no top bar, dock or footer.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const stage = pathname === "/demo" || pathname.startsWith("/demo/");
  return (
    <>
      <SkipLink />
      {!stage && <TopBar overlay={pathname === "/"} />}
      {!stage && <SideDock />}
      <main id="content">{children}</main>
      {!stage && <Footer />}
      <MockRibbon />
      <CreditsDrawer />
    </>
  );
}

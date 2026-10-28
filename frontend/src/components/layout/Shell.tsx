"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** STUB (owned by the shell agent): replaced by TopBar + SideDock + Footer + MockRibbon. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="container-page flex h-[70px] items-center gap-[18px]">
        <Link href="/">Cryptiq</Link>
      </header>
      <main id="content">{children}</main>
    </>
  );
}

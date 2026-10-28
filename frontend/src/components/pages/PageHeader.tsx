import type { ReactNode } from "react";

/** Eyebrow + big heading + intro, left-aligned (DESIGN.md: eyebrow above every section heading). */
export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="mb-[35px] sm:mb-[53px]">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h-md mt-[13px] max-w-[18ch] text-balance">{title}</h1>
      {intro && <p className="measure mt-[18px] text-body-lg text-ash-gray">{intro}</p>}
      {children}
    </header>
  );
}

/** Section wrapper with an anchor id and a heading. */
export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-[96px] border-t border-carbon pt-[35px] first:border-t-0 first:pt-0 [&+&]:mt-[53px]">
      <h2 id={id ? `${id}-h` : undefined} className="sub mb-[18px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

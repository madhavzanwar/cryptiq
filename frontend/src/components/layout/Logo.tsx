import Link from "next/link";

/**
 * The mark only: the logo contains no lettering and the product name never appears beside it.
 * Reduced motion gets the still copy (the animated SVG cannot see the page's motion preference).
 */
export function Logo({ alt, className }: { alt: string; className?: string }) {
  return (
    <Link href="/" aria-label={alt} className={className ?? "inline-flex items-center"}>
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/brand/logo-mark-static.svg" />
        <img src="/brand/logo-mark.svg" alt="" width={44} height={44} className="size-11" />
      </picture>
    </Link>
  );
}

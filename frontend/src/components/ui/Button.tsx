"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "green" | "black" | "ghost";

const base =
  "inline-flex min-h-11 select-none items-center justify-center gap-[9px] whitespace-nowrap rounded-button border border-transparent font-medium " +
  "transition-[background-color,color,border-color,transform] duration-[120ms] ease-out active:scale-[0.97] " +
  "disabled:cursor-not-allowed disabled:bg-plaster disabled:text-slate-gray disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  /** The single saturated green on a screen: the primary action. Carbon text (white fails AA on this green). */
  green: "bg-acid-lime text-carbon hover:bg-carbon hover:text-pure-white",
  black: "bg-carbon text-pure-white hover:bg-obsidian",
  ghost: "border-carbon bg-transparent text-carbon hover:bg-carbon hover:text-pure-white",
};

const sizes = {
  md: "px-[18px] py-[13px] text-body",
  lg: "px-[26px] py-[18px] text-body-lg",
};

interface Common {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common> & { href?: undefined };
type AsLink = Common & { href: string; external?: boolean; onClick?: () => void; "aria-label"?: string };

/** `<Button href="/check">` renders a link; otherwise a real button. */
export function Button(props: AsButton | AsLink) {
  const { variant = "black", size = "md", loading, className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], className);
  const inner = (
    <>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (props.href !== undefined) {
    const { href, external, onClick } = props;
    return external ? (
      <a className={cls} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} aria-label={props["aria-label"]}>
        {inner}
      </a>
    ) : (
      <Link className={cls} href={href} onClick={onClick} aria-label={props["aria-label"]}>
        {inner}
      </Link>
    );
  }
  const { variant: _v, size: _s, loading: _l, className: _c, children: _ch, href: _h, ...rest } = props;
  return (
    <button type="button" {...rest} className={cls} aria-busy={loading || undefined} disabled={rest.disabled || loading}>
      {inner}
    </button>
  );
}

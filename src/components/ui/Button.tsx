import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

/**
 * Brutalist button: square, 2px ink rule, hard offset shadow with no blur.
 * Hover lifts the block up-left and lengthens the shadow; active drops it flat
 * onto the page. That travel is the whole affordance — there is no gradient or
 * glow doing the work.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 select-none border-2 border-hairline " +
  "font-display font-semibold uppercase tracking-wide " +
  "transition-[transform,box-shadow,background-color,color] duration-100 " +
  "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift " +
  "active:translate-x-0 active:translate-y-0 active:shadow-press " +
  "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none " +
  "disabled:translate-x-0 disabled:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  // Flat green block with ink text — 7.8:1, and louder than any glow.
  primary: "bg-squib text-ink shadow-card hover:bg-squib-soft",
  // Inverts to a solid ink block on hover. No half measures.
  ghost: "bg-transparent text-ink shadow-card hover:bg-ink hover:text-cream",
  quiet: "bg-surface text-ink shadow-card hover:bg-cream",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-[15px]",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  extra = "",
) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}

type Shared = { variant?: Variant; size?: Size; loading?: boolean };

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Shared) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href = "#",
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Omit<Shared, "loading">) {
  const classes = buttonClasses(variant, size, className);

  // Internal routes go through next/link so navigation stays client-side.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}

/** Square spinner — a rotating block, not a soft ring. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`h-3.5 w-3.5 shrink-0 animate-spin border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

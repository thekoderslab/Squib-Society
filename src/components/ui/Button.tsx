import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<Variant, string> = {
  // solid green, obviously clickable, high contrast — the funnel depends on it
  primary:
    "bg-squib text-white shadow-green hover:bg-squib-deep active:bg-squib-deep",
  ghost:
    "bg-transparent text-ink border border-ink/25 hover:border-ink/60 hover:bg-ink/[0.04]",
  quiet:
    "bg-surface text-ink border border-hairline shadow-card hover:border-ink/30",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-11 px-5 text-[15px] rounded-full",
  lg: "h-14 px-7 text-base rounded-full",
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
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Omit<Shared, "loading">) {
  return (
    <a {...rest} className={buttonClasses(variant, size, className)}>
      {children}
    </a>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

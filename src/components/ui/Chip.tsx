import type { ReactNode } from "react";

type Tone = "neutral" | "green" | "flare" | "outline";

/** Rubber-stamp chips: square, ruled, uppercase, mono. */
const TONES: Record<Tone, string> = {
  neutral: "bg-cream text-ink border-hairline",
  green: "bg-squib text-ink border-hairline",
  flare: "bg-flare text-cream border-hairline",
  outline: "bg-surface text-ink/70 border-hairline",
};

export default function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase leading-tight tracking-wider ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3 w-3 ${className}`} aria-hidden>
      <path
        d="M3 8.5 6.2 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

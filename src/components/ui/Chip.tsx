import type { ReactNode } from "react";

type Tone = "neutral" | "green" | "flare" | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink/70 border-transparent",
  green: "bg-squib text-white border-transparent",
  flare: "bg-flare/10 text-flare border-flare/25",
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${TONES[tone]} ${className}`}
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
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

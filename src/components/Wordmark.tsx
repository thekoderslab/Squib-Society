import { COLLECTION_NAME } from "@/lib/constants";

/** Logo lockup: a squib head as the mark, the name set in the display face. */
export default function Wordmark({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden focusable="false">
        <circle cx="16" cy="14" r="11" fill="#56B947" />
        <ellipse cx="11.8" cy="12.8" rx="2.3" ry="2.9" fill="#171310" />
        <ellipse cx="20.2" cy="12.8" rx="2.3" ry="2.9" fill="#171310" />
        <circle cx="11" cy="11.6" r="0.8" fill="#fff" />
        <circle cx="19.4" cy="11.6" r="0.8" fill="#fff" />
        <g stroke="#3E8F33" strokeWidth="2.2" strokeLinecap="round">
          <path d="M11.4 23.4c-.5 2.6 0 4 .9 4.7" />
          <path d="M16 24.6c0 2.6.2 4 1 4.6" />
          <path d="M20.6 23.4c.5 2.6.1 4-.8 4.7" />
        </g>
      </svg>
      <span
        className={`font-display font-semibold tracking-tightest ${
          compact ? "text-[17px]" : "text-lg"
        }`}
      >
        {COLLECTION_NAME}
      </span>
    </span>
  );
}

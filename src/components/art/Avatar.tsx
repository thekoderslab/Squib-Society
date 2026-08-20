import Image from "next/image";

/**
 * Generated squib-head avatars, derived from the handle. Beats grey initials
 * on a page about character toys, and keeps the palette disciplined: every
 * tint below is a green or a warm neutral, never a fifth hue.
 *
 * // INTEGRATION: X OAuth — swap for the real profile_image_url once connected.
 */

const TINTS: [string, string][] = [
  ["#E8F4E5", "#56B947"],
  ["#DDEFD8", "#3E8F33"],
  ["#F0EADC", "#7E8C5F"],
  ["#E4EFE0", "#4FA843"],
  ["#EFE7D9", "#9A8B6B"],
  ["#E1F0DE", "#2E7226"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({
  handle,
  src,
  className = "h-8 w-8",
}: {
  handle: string;
  /** Real X profile picture. Falls back to the generated head when absent. */
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={96}
        height={96}
        aria-hidden
        className={`shrink-0 border-2 border-hairline object-cover ${className}`}
      />
    );
  }

  const h = hash(handle);
  const [bg, fg] = TINTS[h % TINTS.length];
  const tilt = ((h >> 3) % 5) - 2;

  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-none border-2 border-hairline ${className}`}
      style={{ background: bg }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" focusable="false">
        <g transform={`rotate(${tilt} 20 20)`}>
          <circle cx="20" cy="18" r="13" fill={fg} />
          <ellipse cx="15.5" cy="16.5" rx="2.6" ry="3.2" fill="#171310" />
          <ellipse cx="24.5" cy="16.5" rx="2.6" ry="3.2" fill="#171310" />
          <circle cx="14.6" cy="15.2" r="0.9" fill="#fff" opacity="0.9" />
          <circle cx="23.6" cy="15.2" r="0.9" fill="#fff" opacity="0.9" />
          <g stroke={fg} strokeWidth="2" strokeLinecap="round" opacity="0.85">
            <path d="M15 28c-.6 3 0 4.6 1 5.4" />
            <path d="M20 29.4c0 3 .3 4.6 1.2 5.2" />
            <path d="M25 28c.6 3 .2 4.6-.8 5.4" />
          </g>
        </g>
      </svg>
    </span>
  );
}

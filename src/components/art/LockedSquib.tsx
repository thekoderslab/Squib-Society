/**
 * The locked silhouette, defined once as an SVG <symbol> and referenced by
 * every locked tile. There are 360 of them on screen — a full inline SVG per
 * tile would be wasteful, and framer-motion on each would be worse. Locked
 * tiles animate with CSS only.
 */

export const LOCKED_SYMBOL_ID = "squib-silhouette";

/** Render exactly once, anywhere inside the section that uses <LockedSquib>. */
export function LockedSquibDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <symbol id={LOCKED_SYMBOL_ID} viewBox="0 0 200 240">
        <circle cx="100" cy="92" r="58" />
        <rect x="60" y="140" width="80" height="66" rx="30" />
        <rect x="74" y="186" width="18" height="34" rx="9" />
        <rect x="108" y="186" width="18" height="34" rx="9" />
        <circle cx="46" cy="176" r="13" />
        <circle cx="154" cy="176" r="13" />
      </symbol>
    </svg>
  );
}

export default function LockedSquib({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden focusable="false">
      <use href={`#${LOCKED_SYMBOL_ID}`} fill="currentColor" />
    </svg>
  );
}

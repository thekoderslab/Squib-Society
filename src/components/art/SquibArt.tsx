import type { SquibVariant } from "@/lib/types";

/**
 * Vector stand-ins for the studio photography.
 *
 * These exist so the site is complete and on-brand before the product shots
 * land. When the PNGs arrive, set `photo` on the squib in mock-api.ts and
 * <SquibImage> switches over — nothing here needs deleting.
 *
 * Shared anatomy: round green head, glossy black eyes, small tentacle mouth.
 * Everything else is the hobby.
 */

const GREEN = "#56B947";
const DEEP = "#3E8F33";
const DARK = "#2E7226";
const EYE = "#171310";
const RED = "#D8362B";
const CREAM = "#FBF8F2";
const KHAKI = "#C3A972";

export type SquibArtProps = {
  variant: SquibVariant;
  className?: string;
  /** Empty string marks it decorative when a caption already names it. */
  label?: string;
};

export default function SquibArt({ variant, className, label }: SquibArtProps) {
  const decorative = label === "";
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <defs>
        <radialGradient id={`sq-sheen-${variant}`} cx="34%" cy="26%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`sq-shade-${variant}`} cx="52%" cy="92%" r="58%">
          <stop offset="0%" stopColor={DARK} stopOpacity="0.45" />
          <stop offset="100%" stopColor={DARK} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`sq-floor-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#262019" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#262019" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* contact shadow — the toy sits on a surface, it doesn't float */}
      <ellipse cx="100" cy="226" rx="56" ry="10" fill={`url(#sq-floor-${variant})`} />

      <Behind variant={variant} />
      <Legs variant={variant} />
      <Torso variant={variant} />
      <Arms variant={variant} />
      <Head variant={variant} />
      <Hat variant={variant} />
    </svg>
  );
}

/* ── anatomy ──────────────────────────────────────────────────────────── */

function Legs({ variant }: { variant: SquibVariant }) {
  const boot =
    variant === "firefighter" ? "#2B2F38" : variant === "ninja" ? "#232838" : DEEP;
  return (
    <g>
      <rect x="76" y="182" width="17" height="34" rx="8.5" fill={GREEN} />
      <rect x="107" y="182" width="17" height="34" rx="8.5" fill={GREEN} />
      <rect x="70" y="206" width="26" height="14" rx="7" fill={boot} />
      <rect x="104" y="206" width="26" height="14" rx="7" fill={boot} />
    </g>
  );
}

function Torso({ variant }: { variant: SquibVariant }) {
  return (
    <g>
      <rect x="61" y="138" width="78" height="62" rx="28" fill={GREEN} />
      <rect x="61" y="138" width="78" height="62" rx="28" fill={`url(#sq-sheen-${variant})`} />
      <Outfit variant={variant} />
    </g>
  );
}

function Arms({ variant }: { variant: SquibVariant }) {
  const glove = variant === "boxer";
  return (
    <g>
      <rect
        x="42"
        y="146"
        width="18"
        height="42"
        rx="9"
        fill={GREEN}
        transform="rotate(-9 51 167)"
      />
      <rect
        x="140"
        y="146"
        width="18"
        height="42"
        rx="9"
        fill={GREEN}
        transform="rotate(9 149 167)"
      />
      {glove ? (
        <g>
          <circle cx="45" cy="192" r="17" fill={RED} />
          <circle cx="155" cy="192" r="17" fill={RED} />
          <path d="M34 190h22" stroke="#A82A21" strokeWidth="3" strokeLinecap="round" />
          <path d="M144 190h22" stroke="#A82A21" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="46" cy="190" r="11" fill={GREEN} />
          <circle cx="154" cy="190" r="11" fill={GREEN} />
        </g>
      )}
    </g>
  );
}

function Head({ variant }: { variant: SquibVariant }) {
  return (
    <g>
      <circle cx="100" cy="88" r="56" fill={GREEN} />
      {/* underside shading keeps it reading as a molded sphere, not a disc */}
      <circle cx="100" cy="88" r="56" fill={`url(#sq-shade-${variant})`} />
      <circle cx="100" cy="88" r="56" fill={`url(#sq-sheen-${variant})`} />

      {/* tentacle mouth — five short curls, the friendliest part of the face */}
      <g stroke={DEEP} strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M79 112c-3 8-1 14 3 17" />
        <path d="M90 116c-2 9 0 15 4 18" />
        <path d="M101 118c0 9 1 15 5 17" />
        <path d="M112 116c2 9 1 15-3 18" />
        <path d="M122 111c3 8 2 14-2 17" />
      </g>

      {/* glossy eyes */}
      <g>
        <ellipse cx="80" cy="84" rx="10.5" ry="13" fill={EYE} />
        <ellipse cx="120" cy="84" rx="10.5" ry="13" fill={EYE} />
        <circle cx="76.5" cy="79" r="3.4" fill="#FFFFFF" opacity="0.92" />
        <circle cx="116.5" cy="79" r="3.4" fill="#FFFFFF" opacity="0.92" />
        <circle cx="84" cy="90" r="1.6" fill="#FFFFFF" opacity="0.5" />
        <circle cx="124" cy="90" r="1.6" fill="#FFFFFF" opacity="0.5" />
      </g>

    </g>
  );
}

/* ── costume: things worn on the body ─────────────────────────────────── */

function Outfit({ variant }: { variant: SquibVariant }) {
  switch (variant) {
    case "boxer":
      return (
        <g>
          <path
            d="M64 172h72v14a14 14 0 0 1-14 14H78a14 14 0 0 1-14-14v-14Z"
            fill={RED}
          />
          <rect x="64" y="168" width="72" height="9" rx="4" fill={CREAM} />
        </g>
      );
    case "explorer":
      return (
        <g>
          <path d="M64 150h72v36a14 14 0 0 1-14 14H78a14 14 0 0 1-14-14v-36Z" fill={KHAKI} />
          <rect x="72" y="162" width="18" height="16" rx="4" fill="#B29963" />
          <rect x="110" y="162" width="18" height="16" rx="4" fill="#B29963" />
          <path d="M78 138h44l-22 26-22-26Z" fill={RED} />
        </g>
      );
    case "skater":
      return (
        <g>
          <path d="M63 150h74v36a14 14 0 0 1-14 14H77a14 14 0 0 1-14-14v-36Z" fill={CREAM} />
          <path d="M88 142c4 9 20 9 24 0" stroke="#CFC6B4" strokeWidth="4" fill="none" />
          <path d="M92 150v20M108 150v20" stroke="#CFC6B4" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "baseball":
      return (
        <g>
          <path d="M63 148h74v38a14 14 0 0 1-14 14H77a14 14 0 0 1-14-14v-38Z" fill={CREAM} />
          <rect x="96" y="148" width="8" height="52" fill={RED} opacity="0.9" />
          <path d="M74 152v46M126 152v46" stroke="#D9CFBB" strokeWidth="3" />
        </g>
      );
    case "ninja":
      return (
        <g>
          <path d="M63 148h74v38a14 14 0 0 1-14 14H77a14 14 0 0 1-14-14v-38Z" fill="#2B3145" />
          <path d="M100 148 78 168v-20h22Zm0 0 22 20v-20h-22Z" fill="#39415A" />
          <rect x="63" y="178" width="74" height="12" fill={RED} />
        </g>
      );
    case "chef":
      return (
        <g>
          <path d="M68 146h64v40a14 14 0 0 1-14 14H82a14 14 0 0 1-14-14v-40Z" fill={CREAM} />
          <path d="M88 138l12 10 12-10" stroke="#D9CFBB" strokeWidth="4" fill="none" />
          <rect x="86" y="176" width="28" height="16" rx="4" fill="#EDE5D6" />
        </g>
      );
    case "gardener":
      return (
        <g>
          <path d="M68 146h64v40a14 14 0 0 1-14 14H82a14 14 0 0 1-14-14v-40Z" fill={DEEP} />
          <path d="M88 138l12 10 12-10" stroke="#33772A" strokeWidth="4" fill="none" />
          <rect x="86" y="172" width="28" height="18" rx="5" fill="#33772A" />
        </g>
      );
    case "dj":
      return (
        <g>
          <path d="M63 150h74v36a14 14 0 0 1-14 14H77a14 14 0 0 1-14-14v-36Z" fill="#242A33" />
          <circle cx="100" cy="172" r="15" fill={CREAM} />
          <circle cx="100" cy="172" r="4" fill="#242A33" />
        </g>
      );
    case "firefighter":
      return (
        <g>
          <path d="M63 148h74v38a14 14 0 0 1-14 14H77a14 14 0 0 1-14-14v-38Z" fill="#2B2F38" />
          <rect x="63" y="162" width="74" height="8" fill="#E6C24E" />
          <rect x="63" y="182" width="74" height="8" fill="#E6C24E" />
        </g>
      );
    default:
      return null;
  }
}

/* ── costume: things worn on or near the head ─────────────────────────── */

function Hat({ variant }: { variant: SquibVariant }) {
  switch (variant) {
    case "explorer":
      return (
        <g>
          <ellipse cx="100" cy="56" rx="70" ry="13" fill="#D2BC8C" />
          <path d="M46 56a54 40 0 0 1 108 0Z" fill={KHAKI} />
          <rect x="46" y="49" width="108" height="8" fill="#8E7A4E" opacity="0.75" />
        </g>
      );
    case "skater":
      return (
        <g>
          <path d="M46 62a54 46 0 0 1 108 0Z" fill="#2B3145" />
          <rect x="45" y="54" width="110" height="12" rx="6" fill="#39415A" />
          <circle cx="100" cy="18" r="10" fill={CREAM} />
        </g>
      );
    case "baseball":
      return (
        <g>
          <path d="M48 66a52 44 0 0 1 104 0Z" fill={RED} />
          <path d="M148 62c16 0 30 5 34 11H140c0-5 3-11 8-11Z" fill="#B92C22" />
          <circle cx="100" cy="24" r="5" fill="#B92C22" />
        </g>
      );
    case "chef":
      return (
        <g>
          <circle cx="74" cy="30" r="19" fill={CREAM} />
          <circle cx="100" cy="20" r="22" fill={CREAM} />
          <circle cx="126" cy="30" r="19" fill={CREAM} />
          <rect x="62" y="38" width="76" height="20" rx="8" fill="#F2EBDC" />
        </g>
      );
    case "gardener":
      return (
        <g>
          <ellipse cx="100" cy="58" rx="76" ry="14" fill="#DFC98F" />
          <path d="M52 58a48 38 0 0 1 96 0Z" fill="#E9D6A2" />
          <rect x="52" y="50" width="96" height="8" fill={DEEP} opacity="0.85" />
        </g>
      );
    case "dj":
      return (
        <g>
          <path
            d="M44 92a56 56 0 0 1 112 0"
            stroke="#242A33"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="30" y="80" width="24" height="34" rx="11" fill="#242A33" />
          <rect x="146" y="80" width="24" height="34" rx="11" fill="#242A33" />
          <rect x="36" y="88" width="12" height="18" rx="6" fill="#4A525F" />
          <rect x="152" y="88" width="12" height="18" rx="6" fill="#4A525F" />
        </g>
      );
    case "firefighter":
      return (
        <g>
          <path d="M50 64a50 42 0 0 1 100 0Z" fill={RED} />
          <ellipse cx="100" cy="64" rx="62" ry="11" fill="#B92C22" />
          <path d="M92 28h16l4 22H88l4-22Z" fill="#E6C24E" />
        </g>
      );
    case "ninja":
      return (
        <g>
          {/* headband across the forehead, tails trailing right */}
          <rect x="52" y="48" width="96" height="15" rx="3" fill="#2B3145" />
          <rect x="52" y="53" width="96" height="4" fill={RED} opacity="0.85" />
          <path d="M146 50c15 2 26 8 33 17-12-6-23-9-33-8Z" fill="#2B3145" />
          <path d="M146 59c14 5 24 13 29 23-11-8-21-13-29-14Z" fill="#2B3145" />
        </g>
      );
    case "boxer":
    default:
      return null;
  }
}

/** Drawn behind the body: props that lean or sit on the floor. */
function Behind({ variant }: { variant: SquibVariant }) {
  switch (variant) {
    case "skater":
      return (
        <g>
          <rect x="46" y="214" width="108" height="12" rx="6" fill="#241F1A" />
          <circle cx="68" cy="230" r="7" fill="#C9BFAB" />
          <circle cx="132" cy="230" r="7" fill="#C9BFAB" />
        </g>
      );
    case "baseball":
      return (
        <rect
          x="160"
          y="96"
          width="14"
          height="104"
          rx="7"
          fill="#C8A56E"
          transform="rotate(14 167 148)"
        />
      );
    case "ninja":
      return (
        <g transform="rotate(-32 100 130)">
          <rect x="150" y="60" width="8" height="96" rx="4" fill="#B9BEC7" />
          <rect x="146" y="152" width="16" height="10" rx="3" fill="#2B3145" />
        </g>
      );
    case "gardener":
      return (
        <g>
          <rect x="150" y="176" width="34" height="30" rx="8" fill="#9BA6AF" />
          <path d="M184 182l14-8v12l-14 4Z" fill="#9BA6AF" />
        </g>
      );
    default:
      return null;
  }
}

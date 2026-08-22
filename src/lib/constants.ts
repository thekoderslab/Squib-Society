/**
 * Single source of truth for anything that might change before launch.
 * Nothing in here should be duplicated into a component.
 */

export const COLLECTION_NAME = "Squib Society"; // working name — may change
export const TOTAL_SUPPLY = 369;
export const CHAIN = "Robinhood Chain"; // EVM / Arbitrum L2
export const CHAIN_SUBTITLE = "EVM · Arbitrum L2";
export const MINT_VENUE = "OpenSea"; // minting happens off-site — no mint UI here
export const WL_WINNERS = 20; // top N from the leaderboard at snapshot

export const SITE_URL = "https://squibsociety.xyz";
export const X_HANDLE = "@SquibSociety";
export const X_URL = "https://x.com/SquibSociety";
export const OPENSEA_URL = "https://opensea.io/collection/squib-society"; // placeholder
/** The post the like, repost and quote tasks point at. */
export const PINNED_POST_ID = "2090843215754928485";
export const PINNED_POST_URL = `https://x.com/${X_HANDLE.slice(1)}/status/${PINNED_POST_ID}`;

/** The domain without the protocol. Reads better in a post; X still links it. */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Pre-filled quote copy.
 *
 * Four variants rather than one, picked at random. Hundreds of accounts posting
 * a byte-identical string is exactly what X's spam heuristics look for, and a
 * timeline of the same sentence reads like a bot farm even when it isn't.
 * Every one is editable: this is a starting point, not a script.
 */
export const QUOTE_LINES = [
  `Just got my spot in ${X_HANDLE}. 369 squibs, every one of them up to something. Get yours at ${SITE_DOMAIN}`,
  `On the ${X_HANDLE} allowlist. 369 squibs and no two the same. Grab a spot at ${SITE_DOMAIN}`,
  `Took my spot in ${X_HANDLE}. One of 369, and they are all up to something. ${SITE_DOMAIN}`,
  `${X_HANDLE} allowlist is open and I am on it. 369 squibs. Get yours: ${SITE_DOMAIN}`,
];

/**
 * X action intents. These open the actual like or repost dialog rather than
 * dropping someone on the post to find the button themselves, which is the
 * difference between a task people finish and one they abandon.
 */
export const X_INTENT = {
  follow: `https://x.com/intent/follow?screen_name=${X_HANDLE.slice(1)}`,
  like: `https://x.com/intent/like?tweet_id=${PINNED_POST_ID}`,
  repost: `https://x.com/intent/retweet?tweet_id=${PINNED_POST_ID}`,
  /**
   * No dedicated quote intent exists. Attaching the post URL makes it one.
   *
   * The variant is chosen when the module loads, not when the button is
   * pressed, so one visitor keeps one line. It is never rendered into the DOM
   * (the button calls window.open with it), so the randomness cannot cause a
   * hydration mismatch.
   */
  quote:
    `https://x.com/intent/post?` +
    new URLSearchParams({
      url: `https://x.com/${X_HANDLE.slice(1)}/status/${PINNED_POST_ID}`,
      text: QUOTE_LINES[Math.floor(Math.random() * QUOTE_LINES.length)],
    }).toString(),
};

/** Snapshot deadline for the leaderboard top-20. ISO, UTC. */
export const SNAPSHOT_ISO = "2026-09-15T18:00:00.000Z";

/** Odds shown to the user for the GTD upgrade spin. Server decides the result. */
export const GTD_SPIN_ODDS = 0.125; // 1 in 8

/** Points economy. Deliberately weighted toward returning, not toward reach. */
export const POINTS = {
  follow: 50,
  like: 25,
  retweet: 40,
  quote: 75, // bonus task
  checkIn: 20,
  streakBonusPerDay: 5,
  streakBonusCap: 60,
  dailyQuest: 30,
  trivia: 40,
  gamePerCatch: 3,
  gameDailyCap: 90,
} as const;

/** Brand marks. The bare squib head is the logo. */
export const LOGO = {
  /** Sits on any background — used in the nav, footer and ambient moments. */
  mark: "/logo/squib-logo-transparent.png",
  /** Lime field, for the favicon, OG card and social avatars. */
  badge: "/logo/squib-logo-lime-ccff00.png",
} as const;

/**
 * Hidden form field. Humans never fill it, naive form-filling bots always do.
 * Shared here so the client and the route handler agree on the name.
 */
export const HONEYPOT_FIELD = "squib_website";

export const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const NAV_LINKS = [
  { label: "Squib", href: "/squib" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Allowlist", href: "/allowlist" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;

/**
 * Catch the squib. Same 24 hour rolling cooldown as the spin.
 *
 * Deliberately NOT `as const`: these are numbers that get decremented, seeded
 * into state and used in arithmetic. A const assertion would give them literal
 * types, so `useState(GAME.roundSeconds)` would infer state of type `20` and
 * refuse every decrement.
 */
export const GAME = {
  cooldownHours: 24,
  roundSeconds: 20,
  cells: 9,
  /** How long a squib stays up before ducking back down. */
  popMs: 900,
};

/**
 * The task row flow. Plain object, not `as const`: these are numbers that get
 * decremented and seeded into state.
 */
export const TASK_FLOW = {
  /** How long the Go button waits before it turns into Verify. */
  goWaitSeconds: 10,
  /** Floor on how long a verification takes, so it reads as work being done. */
  verifyMs: 2000,
};

export type SpinSegment = {
  kind: "points" | "gtd" | "again";
  points: number;
  label: string;
  /**
   * Relative chance of landing here. Not a percentage, the server normalises
   * them. Keep GTD low: it is the only segment that hands out a real spot.
   */
  weight: number;
};

/**
 * Daily spin. One pull every 24 hours.
 *
 * Order is the order the segments sit on the wheel, clockwise from the top.
 * "again" does not burn the cooldown, so it costs the player nothing but a
 * second of suspense.
 */
export const DAILY_SPIN = {
  cooldownHours: 24,
  segments: [
    { kind: "points", points: 25, label: "25", weight: 18 },
    { kind: "points", points: 60, label: "60", weight: 10 },
    { kind: "again", points: 0, label: "Again", weight: 12 },
    { kind: "points", points: 100, label: "100", weight: 8 },
    { kind: "points", points: 15, label: "15", weight: 18 },
    { kind: "gtd", points: 50, label: "GTD", weight: 1 },
    { kind: "points", points: 40, label: "40", weight: 16 },
    { kind: "again", points: 0, label: "Again", weight: 12 },
    { kind: "points", points: 250, label: "250", weight: 3 },
    { kind: "points", points: 10, label: "10", weight: 18 },
  ] as SpinSegment[],
};

/**
 * How the sign in tab tells the tab you started from that it is done.
 *
 * BroadcastChannel reaches every tab on this origin at once, which is what we
 * want: the visitor may have the site open more than once. The storage key is
 * the fallback for anything without it, since a write fires a storage event in
 * every other tab of the same origin.
 */
export const AUTH_CHANNEL = "squib-auth";
export const AUTH_PING_KEY = "squib-society/auth-ping";

/** localStorage key for the mocked user session. Bump the suffix to reset. */
export const STORAGE_KEY = "squib-society/progress/v2";

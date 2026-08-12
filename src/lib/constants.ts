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

export const SITE_URL = "https://squibsociety.xyz"; // placeholder
export const X_HANDLE = "@SquibSociety";
export const X_URL = "https://x.com/SquibSociety";
export const OPENSEA_URL = "https://opensea.io/collection/squib-society"; // placeholder
export const PINNED_POST_URL = "https://x.com/squibsociety/status/1"; // placeholder

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

export const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Allowlist", href: "/allowlist" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;

/**
 * Daily spin. One pull every 24 hours, points only.
 * Segment order is the order they sit on the wheel, clockwise from the top.
 */
export const DAILY_SPIN = {
  cooldownHours: 24,
  prizes: [10, 40, 20, 100, 15, 60, 25, 250],
} as const;

/** localStorage key for the mocked user session. Bump the suffix to reset. */
export const STORAGE_KEY = "squib-society/progress/v1";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SEAM.
 *
 * Every piece of dynamic data on this site is read through a typed function in
 * this file. Today they all return mock data from memory. Wiring a real backend
 * is a one-file change: swap the body, keep the signature.
 *
 * Each external dependency is marked with an `// INTEGRATION:` comment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  COLLECTION_NAME,
  GTD_SPIN_ODDS,
  PINNED_POST_URL,
  POINTS,
  REVEAL_MILESTONES,
  SITE_URL,
  TOTAL_SUPPLY,
  X_HANDLE,
} from "./constants";
import type {
  DailyQuest,
  LeaderboardEntry,
  RevealProgress,
  SpinResult,
  Squib,
  SubmitResult,
  Task,
  TriviaQuestion,
  XAccount,
} from "./types";

/** Fake network latency so loading states are real and visible in dev. */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ───────────────────────────── The Vault ──────────────────────────────── */

/**
 * The revealed squibs. `photo` is intentionally absent — until the studio
 * shots land, tiles render the vector stand-in for `variant`.
 * When the PNGs arrive: photo: "/squibs/0025-boxer.png" and nothing else changes.
 */
export const REVEALED_SQUIBS: Squib[] = [
  {
    id: 9,
    name: "Mage",
    role: "Skater",
    photo: "/squibs/0009-mage-squib.png",
    scene: "Skatepark, late afternoon",
    bio: "Named for what he used to be. Kickflips now, cosmic dread later — he's booked solid until Thursday.",
  },
  {
    id: 18,
    name: "Comet",
    role: "Ninja",
    photo: "/squibs/0018-comet-squib.png",
    scene: "Raked gravel garden",
    bio: "Moves without a sound. Still cannot enter a room without announcing the snack situation.",
  },
  {
    id: 52,
    name: "Fox",
    role: "Winter walker",
    photo: "/squibs/0052-fox-squib.png",
    scene: "Snowed-in park bridge",
    bio: "Sat out an ice age and found it a bit warm. The scarf is not up for discussion.",
  },
  {
    id: 63,
    name: "Sprite",
    role: "Highland formal",
    photo: "/squibs/0063-sprite-squib.png",
    scene: "Loch-side castle",
    bio: "Wears the tartan of a clan that predates clans. Nobody has asked to see the paperwork.",
  },
  {
    id: 80,
    name: "Warden",
    role: "Forest archer",
    photo: "/squibs/0080-warden-squib.png",
    scene: "Overgrown ruins",
    bio: "Guarded a sunken gate for an age and a half. Now guards the tree line and one specific patch of moss.",
  },
  {
    id: 184,
    name: "Lotus",
    role: "Chef",
    photo: "/squibs/0184-lotus-squib.png",
    scene: "Marble kitchen, morning",
    bio: "Once boiled an ocean by accident. Now boils exactly 240ml and calls that growth.",
  },
  {
    id: 355,
    name: "Drifter",
    role: "Harbour regular",
    photo: "/squibs/0355-drifter-squib.png",
    scene: "Marina, off season",
    bio: "Came in on a tide nobody logged. Knows every boat here by the noise it makes at night.",
  },
  {
    id: 356,
    name: "Fox",
    role: "Off duty",
    photo: "/squibs/0356-fox-squib.png",
    scene: "Sunlit courtyard",
    bio: "Owns one jacket. Wears it everywhere. Has never once been cold, or wrong.",
  },
  {
    id: 368,
    name: "Paper Planet",
    role: "Incognito",
    photo: "/squibs/0368-paper-planet-squib.png",
    scene: "Toy room",
    bio: "The face is under there somewhere. The bear is called Gerald and Gerald has seen things.",
  },
  {
    id: 369,
    name: "Skullknit",
    role: "Workshop punk",
    photo: "/squibs/0369-skullknit-squib.png",
    scene: "Empty workshop",
    bio: "Wears the old face on the outside so you know what you're dealing with. Still holds the door for people.",
  },
];

/** Fast lookup for the /squib/[id] pages. */
export function getSquibById(id: number): Squib | undefined {
  return REVEALED_SQUIBS.find((s) => s.id === id);
}

/**
 * Fixed, spread-out positions in the 369 grid so the revealed tiles read as
 * scattered discoveries rather than a block in the corner.
 */
export const REVEALED_SLOTS: number[] = [
  4, 37, 66, 101, 140, 168, 205, 247, 296, 341,
];

/** Vault tile index (0-based) → squib, for the tiles that are unlocked. */
export function getVaultMap(): Map<number, Squib> {
  const map = new Map<number, Squib>();
  REVEALED_SLOTS.forEach((slot, i) => {
    const squib = REVEALED_SQUIBS[i];
    if (squib) map.set(slot, squib);
  });
  return map;
}

// INTEGRATION: points ledger + leaderboard — real allowlisted count comes from
// the same store that owns the points ledger (Supabase / quest platform).
const MOCK_ALLOWLISTED_COUNT = 3_214;

export async function getRevealProgress(): Promise<RevealProgress> {
  await wait(180);
  const allowlisted = MOCK_ALLOWLISTED_COUNT;
  const next =
    REVEAL_MILESTONES.find((m) => m.allowlisted > allowlisted) ?? null;
  return {
    revealed: REVEALED_SQUIBS.length,
    total: TOTAL_SUPPLY,
    allowlisted,
    nextMilestone: next ? { ...next } : null,
  };
}

/* ───────────────────────────── Allowlist funnel ───────────────────────── */

export const TASKS: Task[] = [
  {
    id: "follow",
    label: `Follow ${X_HANDLE}`,
    detail: "Required",
    bonus: false,
    points: POINTS.follow,
    href: `https://x.com/${X_HANDLE.replace("@", "")}`,
  },
  {
    id: "like",
    label: "Like the pinned post",
    detail: "Required",
    bonus: false,
    points: POINTS.like,
    href: PINNED_POST_URL,
  },
  {
    id: "retweet",
    label: "Repost the pinned post",
    detail: "Required",
    bonus: false,
    points: POINTS.retweet,
    href: PINNED_POST_URL,
  },
  {
    id: "quote",
    label: "Quote it with your link",
    detail: "Bonus — not required",
    bonus: true,
    points: POINTS.quote,
    href: PINNED_POST_URL,
  },
];

export function getMyTasks(): Task[] {
  return TASKS;
}

/** Mock handles for the fake X connect. Rotates so repeat demos differ. */
const MOCK_HANDLES: XAccount[] = [
  { handle: "tentaclepilled", displayName: "tentacle pilled", seed: "tp" },
  { handle: "vinylgoblin", displayName: "vinyl goblin", seed: "vg" },
  { handle: "shelfappeal", displayName: "shelf appeal", seed: "sa" },
  { handle: "softcosmic", displayName: "soft cosmic", seed: "sc" },
];

// INTEGRATION: X OAuth — replace with the real OAuth 2.0 PKCE round trip.
// Returns the authenticated handle + profile image; store the token server-side.
export async function connectX(): Promise<XAccount> {
  await wait(900);
  return MOCK_HANDLES[Math.floor(Math.random() * MOCK_HANDLES.length)];
}

// INTEGRATION: task verification.
// Recommendation: offload to a quest platform (Zealy / Galxe / TaskOn) instead
// of hand-rolling X API checks — follow/like/repost verification is rate
// limited and expensive at volume, and quote-tweet detection is the least
// reliable of the four. That unreliability is exactly why `quote` is a bonus
// task here and not a hard gate.
export async function verifyTask(id: string): Promise<{ verified: boolean }> {
  await wait(1200);
  void id;
  return { verified: true }; // mock: always passes
}

// INTEGRATION: sybil filtering + points ledger.
// Backend rules to enforce on this call:
//   · one entry per EVM address, one per X user id (not per handle — handles
//     get renamed)
//   · minimum account age and a low follower floor, checked at submit
//   · captcha token verified server-side
//   · points are NEVER accepted from the client; the ledger is authoritative
export async function submitAllowlist(input: {
  handle: string;
  evmAddress: string;
  captchaToken: string;
}): Promise<SubmitResult> {
  await wait(1400);
  void input;
  return { ok: true, rank: 148, points: 115, allowlisted: true };
}

// INTEGRATION: GTD spin (server-authoritative).
// The result must be decided and recorded server-side, once per account, and
// returned signed. Never roll the dice in the browser — this function only
// looks like it does because it is a stand-in.
export async function requestSpin(): Promise<SpinResult> {
  await wait(600);
  return { upgraded: Math.random() < GTD_SPIN_ODDS, odds: GTD_SPIN_ODDS };
}

// INTEGRATION: share intent (pre-filled quote tweet).
export function buildShareIntent(rank: number | null): string {
  const line = rank
    ? `I'm #${rank} on the ${COLLECTION_NAME} allowlist.`
    : `I'm on the ${COLLECTION_NAME} allowlist.`;
  const text = `${line} 369 tiny old gods took up hobbies. Come get your spot 🟢`;
  const params = new URLSearchParams({ text, url: SITE_URL });
  return `https://x.com/intent/post?${params.toString()}`;
}

/* ───────────────────────────── Leaderboard ────────────────────────────── */

const MOCK_BOARD: Omit<LeaderboardEntry, "rank">[] = [
  { handle: "kelpwitch", displayName: "kelp witch", points: 1482, streak: 31 },
  { handle: "mossmarket", displayName: "moss market", points: 1439, streak: 30 },
  { handle: "tinyoldgod", displayName: "tiny old god", points: 1310, streak: 28 },
  { handle: "greenroomonly", displayName: "green room", points: 1287, streak: 29 },
  { handle: "sofglazed", displayName: "soft glaze", points: 1204, streak: 24 },
  { handle: "brinepilled", displayName: "brine", points: 1166, streak: 26 },
  { handle: "vinylgoblin", displayName: "vinyl goblin", points: 1098, streak: 21 },
  { handle: "shelfappeal", displayName: "shelf appeal", points: 1043, streak: 22 },
  { handle: "quietstudio", displayName: "quiet studio", points: 997, streak: 19 },
  { handle: "nofilterclay", displayName: "clay", points: 964, streak: 20 },
  { handle: "boxerbeacon", displayName: "beacon fan", points: 903, streak: 17 },
  { handle: "sundaysets", displayName: "sunday sets", points: 871, streak: 18 },
  { handle: "tentaclepilled", displayName: "tentacle pilled", points: 842, streak: 15 },
  { handle: "matteonly", displayName: "matte only", points: 810, streak: 16 },
  { handle: "deepshelf", displayName: "deep shelf", points: 778, streak: 14 },
  { handle: "softcosmic", displayName: "soft cosmic", points: 741, streak: 13 },
  { handle: "thirdbase", displayName: "third base", points: 706, streak: 12 },
  { handle: "lowtidehours", displayName: "low tide", points: 682, streak: 11 },
  { handle: "gouacheghost", displayName: "gouache", points: 655, streak: 12 },
  { handle: "smallgodsclub", displayName: "small gods", points: 631, streak: 10 },
  { handle: "paperlantern", displayName: "paper lantern", points: 604, streak: 9 },
  { handle: "cozyabyss", displayName: "cozy abyss", points: 588, streak: 9 },
  { handle: "warmgreyco", displayName: "warm grey", points: 561, streak: 8 },
  { handle: "hobbyhorror", displayName: "hobby horror", points: 534, streak: 7 },
  { handle: "toyshelfsaint", displayName: "toy shelf", points: 512, streak: 7 },
];

/**
 * Returns the ranked board. If `you` is supplied, the viewer is spliced in at
 * their true position so the pinned row is honest, not decorative.
 */
export async function getLeaderboard(you?: {
  handle: string;
  displayName: string;
  points: number;
  streak: number;
}): Promise<{ entries: LeaderboardEntry[]; you: LeaderboardEntry | null }> {
  await wait(220);

  const rows = MOCK_BOARD.filter((r) => !you || r.handle !== you.handle).map(
    (r) => ({ ...r, isYou: false }),
  );
  if (you) rows.push({ ...you, isYou: true });

  rows.sort((a, b) => b.points - a.points || a.handle.localeCompare(b.handle));

  const entries = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  return {
    entries,
    you: entries.find((e) => e.isYou) ?? null,
  };
}

/* ───────────────────────────── Retention loops ────────────────────────── */

const QUESTS: DailyQuest[] = [
  {
    id: "q-hobby",
    title: "Name the hobby",
    detail:
      "Reply to today's post with the mundane hobby you'd give your squib. Best answer gets pinned.",
    points: POINTS.dailyQuest,
  },
  {
    id: "q-green",
    title: "Fly the green",
    detail: "Put 🟢 in your display name for 24 hours. Quiet flex, big signal.",
    points: POINTS.dailyQuest,
  },
  {
    id: "q-bring",
    title: "Bring one",
    detail:
      "Share your referral link with one person who actually collects toys. One is enough.",
    points: POINTS.dailyQuest,
  },
  {
    id: "q-shelf",
    title: "Show the shelf",
    detail:
      "Post a photo of a shelf you're proud of and tag us. Vinyl, books, rocks — dealer's choice.",
    points: POINTS.dailyQuest,
  },
  {
    id: "q-guess",
    title: "Call the next reveal",
    detail: "Guess which role comes out of the vault next. Wrong answers still count.",
    points: POINTS.dailyQuest,
  },
];

const TRIVIA: TriviaQuestion[] = [
  {
    id: "t-supply",
    prompt: "How many squibs are there, total?",
    options: ["333", "369", "1,000"],
    answerIndex: 1,
    note: "369. That number is fixed and it is not going up.",
  },
  {
    id: "t-chain",
    prompt: "Which chain is the collection minting on?",
    options: ["Robinhood Chain", "Solana", "Base"],
    answerIndex: 0,
    note: "Robinhood Chain — an EVM L2 built on Arbitrum tech.",
  },
  {
    id: "t-venue",
    prompt: "Where does the mint actually happen?",
    options: ["This site", "OpenSea", "A Discord bot"],
    answerIndex: 1,
    note: "OpenSea. This site never asks you to connect a wallet — nothing to sign here.",
  },
  {
    id: "t-gtd",
    prompt: "How many guaranteed spots come from the leaderboard?",
    options: ["Top 20 at snapshot", "Top 100", "Everyone who checks in"],
    answerIndex: 0,
    note: "Top 20 at snapshot. Everyone who finishes the base tasks is still allowlisted.",
  },
  {
    id: "t-lore",
    prompt: "What is a squib, in one sentence?",
    options: [
      "An ancient cosmic being with a wholesome hobby",
      "A cartoon frog",
      "A generative pixel avatar",
    ],
    answerIndex: 0,
    note: "Old gods. Small hobbies. That's the whole joke and we're committed to it.",
  },
];

/** Deterministic day index so the quest and quiz rotate but never flicker. */
function dayIndex(d = new Date()): number {
  const start = Date.UTC(2026, 0, 1);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((today - start) / 86_400_000);
}

export function getDailyQuest(d = new Date()): DailyQuest {
  return QUESTS[((dayIndex(d) % QUESTS.length) + QUESTS.length) % QUESTS.length];
}

export function getDailyTrivia(d = new Date()): TriviaQuestion {
  return TRIVIA[((dayIndex(d) % TRIVIA.length) + TRIVIA.length) % TRIVIA.length];
}

// INTEGRATION: points ledger — daily check-in must be written server-side with
// the user's timezone recorded, or streaks become trivially farmable.
export async function checkIn(): Promise<{ ok: true }> {
  await wait(500);
  return { ok: true };
}

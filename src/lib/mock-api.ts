/**
 * THE SEAM.
 *
 * Every piece of dynamic data on this site is read through a typed function in
 * this file. Each one returns mock data from memory, and each external
 * dependency is marked with an `// INTEGRATION:` comment.
 */

import { DAILY_SPIN, PINNED_POST_URL, POINTS, SITE_URL, X_HANDLE } from "./constants";
import type {
  LeaderboardEntry,
  SpinResult,
  Squib,
  SubmitResult,
  Task,
  XAccount,
} from "./types";

/** Fake network latency so loading states are real and visible in dev. */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ───────────────────────────── The squibs ─────────────────────────────── */

export const SQUIBS: Squib[] = [
  {
    slug: "mage",
    name: "Mage",
    role: "Skater",
    photo: "/squibs/0009-mage-squib.png",
    scene: "Skatepark, late afternoon",
    bio: "Out most afternoons, back before dark. Landed the kickflip on the four thousandth try and screamed about it.",
  },
  {
    slug: "comet",
    name: "Comet",
    role: "Ninja",
    photo: "/squibs/0018-comet-squib.png",
    scene: "Raked gravel garden",
    bio: "Moves without a sound. Still cannot enter a room without announcing the snack situation.",
  },
  {
    slug: "fox-winter",
    name: "Fox",
    role: "Winter walker",
    photo: "/squibs/0052-fox-squib.png",
    scene: "Snowed-in park bridge",
    bio: "Walks the same loop every morning, whatever the weather is doing. The scarf is not up for discussion.",
  },
  {
    slug: "sprite",
    name: "Sprite",
    role: "Highland formal",
    photo: "/squibs/0063-sprite-squib.png",
    scene: "Loch-side castle",
    bio: "Owns exactly one formal outfit and takes any excuse to wear it. Ties the bow tie by hand every time.",
  },
  {
    slug: "warden",
    name: "Warden",
    role: "Forest archer",
    photo: "/squibs/0080-warden-squib.png",
    scene: "Overgrown ruins",
    bio: "Can hit a mark at forty paces and will absolutely tell you about it. Knows every path through the ruins by heart.",
  },
  {
    slug: "lotus",
    name: "Lotus",
    role: "Chef",
    photo: "/squibs/0184-lotus-squib.png",
    scene: "Marble kitchen, morning",
    bio: "Runs a quiet kitchen and never raises his voice. Measures everything twice, then once more.",
  },
  {
    slug: "drifter",
    name: "Drifter",
    role: "Harbour regular",
    photo: "/squibs/0355-drifter-squib.png",
    scene: "Marina, off season",
    bio: "Spends most mornings on the same stretch of dock. Knows every boat here by the noise it makes at night.",
  },
  {
    slug: "fox-offduty",
    name: "Fox",
    role: "Off duty",
    photo: "/squibs/0356-fox-squib.png",
    scene: "Sunlit courtyard",
    bio: "Owns one jacket. Wears it everywhere. Has never once been cold, or wrong.",
  },
  {
    slug: "paper-planet",
    name: "Paper Planet",
    role: "Incognito",
    photo: "/squibs/0368-paper-planet-squib.png",
    scene: "Toy room",
    bio: "The face is under there somewhere. The bear is called Gerald and Gerald has seen things.",
  },
  {
    slug: "skullknit",
    name: "Skullknit",
    role: "Workshop punk",
    photo: "/squibs/0369-skullknit-squib.png",
    scene: "Empty workshop",
    bio: "Looks like trouble and holds the door open for people anyway. The jacket has been through a lot.",
  },
];

export function getSquibBySlug(slug: string): Squib | undefined {
  return SQUIBS.find((s) => s.slug === slug);
}

/* ───────────────────────────── Allowlist funnel ───────────────────────── */

/**
 * Order matters. The funnel unlocks these one at a time, so the array order is
 * the order the user walks them.
 */
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
    detail: "Bonus, not required",
    bonus: true,
    points: POINTS.quote,
    href: PINNED_POST_URL,
  },
];

export function getMyTasks(): Task[] {
  return TASKS;
}

/**
 * Mock handles for the fake X connect. The extra fields mirror exactly what
 * /2/users/me returns on the free read-only scopes, so the profile card is
 * built against the real shape.
 */
const MOCK_HANDLES: XAccount[] = [
  {
    handle: "tentaclepilled",
    displayName: "tentacle pilled",
    seed: "tp",
    bio: "collecting small green things. mostly harmless.",
    followers: 4821,
    following: 312,
    joinedAt: "2019-04-11",
  },
  {
    handle: "vinylgoblin",
    displayName: "vinyl goblin",
    seed: "vg",
    bio: "shelf full, wallet empty",
    followers: 1290,
    following: 806,
    joinedAt: "2021-08-02",
  },
  {
    handle: "shelfappeal",
    displayName: "shelf appeal",
    seed: "sa",
    bio: "if it has a face i will buy it",
    followers: 17400,
    following: 240,
    joinedAt: "2017-01-23",
    verified: true,
  },
  {
    handle: "softcosmic",
    displayName: "soft cosmic",
    seed: "sc",
    bio: null,
    followers: 233,
    following: 199,
    joinedAt: "2023-11-30",
  },
];

// INTEGRATION: X OAuth
export async function connectX(): Promise<XAccount> {
  await wait(900);
  return MOCK_HANDLES[Math.floor(Math.random() * MOCK_HANDLES.length)];
}

// INTEGRATION: task verification.
// Offload to a quest platform (Zealy / Galxe / TaskOn) rather than hand-rolling
// X API checks. Follow, like and repost verification is rate limited and
// expensive at volume, and quote-tweet detection is the least reliable of the
// four. That is exactly why `quote` is a bonus here and not a hard gate.
export async function verifyTask(id: string): Promise<{ verified: boolean }> {
  await wait(1200);
  void id;
  return { verified: true };
}

// INTEGRATION: sybil filtering + points ledger.
export async function submitAllowlist(input: {
  handle: string;
  evmAddress: string;
  captchaToken: string;
}): Promise<SubmitResult> {
  await wait(1400);
  void input;
  return { ok: true, rank: 148, points: 115, allowlisted: true };
}

// INTEGRATION: daily spin (server-authoritative).
export async function requestSpin(): Promise<SpinResult> {
  await wait(600);
  const total = DAILY_SPIN.segments.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  let i = 0;
  for (; i < DAILY_SPIN.segments.length; i++) {
    roll -= DAILY_SPIN.segments[i].weight;
    if (roll <= 0) break;
  }
  const seg = DAILY_SPIN.segments[Math.min(i, DAILY_SPIN.segments.length - 1)];
  return {
    segment: Math.min(i, DAILY_SPIN.segments.length - 1),
    points: seg.points,
    gtd: seg.kind === "gtd",
    again: seg.kind === "again",
  };
}

// INTEGRATION: share intent (pre-filled quote tweet).
export function buildShareIntent(rank: number | null): string {
  const line = rank
    ? `Just took spot #${rank} on the Squib Society allowlist.`
    : `Just got on the Squib Society allowlist.`;
  const text = `${line} 369 squibs, and every one of them is up to something. Come get yours.`;
  const params = new URLSearchParams({ text, url: SITE_URL });
  return `https://x.com/intent/post?${params.toString()}`;
}

/* ───────────────────────────── Leaderboard ────────────────────────────── */

const MOCK_BOARD: Omit<LeaderboardEntry, "rank">[] = [
  { handle: "kelpwitch", displayName: "kelp witch", points: 1482, streak: 31 },
  { handle: "mossmarket", displayName: "moss market", points: 1439, streak: 30 },
  { handle: "tinyoldgod", displayName: "small hours", points: 1310, streak: 28 },
  { handle: "greenroomonly", displayName: "green room", points: 1287, streak: 29 },
  { handle: "sofglazed", displayName: "soft glaze", points: 1204, streak: 24 },
  { handle: "brinepilled", displayName: "brine", points: 1166, streak: 26 },
  { handle: "vinylgoblin", displayName: "vinyl goblin", points: 1098, streak: 21 },
  { handle: "shelfappeal", displayName: "shelf appeal", points: 1043, streak: 22 },
  { handle: "quietstudio", displayName: "quiet studio", points: 997, streak: 19 },
  { handle: "nofilterclay", displayName: "clay", points: 964, streak: 20 },
  { handle: "boxerbeacon", displayName: "beacon", points: 903, streak: 17 },
  { handle: "sundaysets", displayName: "sunday sets", points: 871, streak: 18 },
  { handle: "tentaclepilled", displayName: "tentacle pilled", points: 842, streak: 15 },
  { handle: "matteonly", displayName: "matte only", points: 810, streak: 16 },
  { handle: "deepshelf", displayName: "deep shelf", points: 778, streak: 14 },
  { handle: "softcosmic", displayName: "soft cosmic", points: 741, streak: 13 },
  { handle: "thirdbase", displayName: "third base", points: 706, streak: 12 },
  { handle: "lowtidehours", displayName: "low tide", points: 682, streak: 11 },
  { handle: "gouacheghost", displayName: "gouache", points: 655, streak: 12 },
  { handle: "smallgodsclub", displayName: "the regulars", points: 631, streak: 10 },
  { handle: "paperlantern", displayName: "paper lantern", points: 604, streak: 9 },
  { handle: "cozyabyss", displayName: "cosy", points: 588, streak: 9 },
  { handle: "warmgreyco", displayName: "warm grey", points: 561, streak: 8 },
  { handle: "hobbyhorror", displayName: "hobby hours", points: 534, streak: 7 },
  { handle: "toyshelfsaint", displayName: "top shelf", points: 512, streak: 7 },
];

export async function getLeaderboard(you?: {
  handle: string;
  displayName: string;
  points: number;
  streak: number;
}): Promise<{ entries: LeaderboardEntry[]; you: LeaderboardEntry | null }> {
  await wait(220);

  const rows = MOCK_BOARD.filter((r) => !you || r.handle !== you.handle).map((r) => ({
    ...r,
    isYou: false,
  }));
  if (you) rows.push({ ...you, isYou: true });

  rows.sort((a, b) => b.points - a.points || a.handle.localeCompare(b.handle));

  const entries = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  return { entries, you: entries.find((e) => e.isYou) ?? null };
}

/* ───────────────────────────── Mini game ─────────────────────────────── */

// INTEGRATION: points ledger
export async function submitGameScore(): Promise<{ ok: true }> {
  await wait(400);
  return { ok: true };
}

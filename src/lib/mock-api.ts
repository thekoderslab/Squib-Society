/**
 * Static content: the squib roster and the task list.
 *
 * Everything dynamic now comes from Supabase through src/lib/api.ts. This file
 * used to hold mock implementations as a fallback; they are gone. A live site
 * quietly serving invented leaderboard rows or a fake allowlist rank is worse
 * than an honest error, because nobody notices it is lying.
 */

import { PINNED_POST_URL, POINTS, SITE_URL, X_HANDLE } from "./constants";
import type { Squib, Task } from "./types";

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
    slug: "tma-squib",
    name: "TMA Squib",
    role: "Incognito",
    photo: "/squibs/0368-tma-squib.png",
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

// INTEGRATION: share intent (pre-filled quote tweet).
export function buildShareIntent(rank: number | null): string {
  const line = rank
    ? `Just took spot #${rank} on the Squib Society allowlist.`
    : `Just got on the Squib Society allowlist.`;
  const text = `${line} 369 squibs, and every one of them is up to something. Come get yours.`;
  const params = new URLSearchParams({ text, url: SITE_URL });
  return `https://x.com/intent/post?${params.toString()}`;
}

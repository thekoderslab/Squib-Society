export type Squib = {
  /** URL segment. No numbers anywhere, so this is what the route uses. */
  slug: string;
  name: string;
  /** What they do. */
  role: string;
  bio: string;
  /** Square render in /public/squibs. */
  photo: string;
  /** Where the shot was taken. */
  scene: string;
};

export type TaskId = "follow" | "like" | "retweet" | "quote";
export type TaskStatus = "pending" | "verifying" | "done";

export type Task = {
  id: TaskId;
  label: string;
  detail: string;
  /** Bonus tasks award points but never block the allowlist. */
  bonus: boolean;
  points: number;
  href: string;
};

/**
 * What we read from X. Everything past `handle` is optional because the OAuth
 * scopes we ask for are the free, read-only ones and any field can come back
 * empty. Never render a row for a value that is not there.
 */
export type XAccount = {
  handle: string;
  displayName: string;
  /** Deterministic seed for the generated avatar fallback. */
  seed: string;
  avatarUrl?: string | null;
  bio?: string | null;
  followers?: number | null;
  following?: number | null;
  /** ISO date the account was created. */
  joinedAt?: string | null;
  verified?: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  handle: string;
  displayName: string;
  points: number;
  streak: number;
  isYou?: boolean;
};

/** Result of one daily spin. `segment` tells the wheel where to stop. */
export type SpinResult = {
  segment: number;
  points: number;
  /** Landed on a guaranteed spot. */
  gtd: boolean;
  /** Landed on "again": the cooldown was not spent, so spin straight away. */
  again: boolean;
};

export type SubmitResult = {
  ok: true;
  rank: number;
  points: number;
  allowlisted: true;
};

export type UserProgress = {
  x: XAccount | null;
  tasks: Record<TaskId, TaskStatus>;
  evmAddress: string | null;
  allowlisted: boolean;
  /** Won a guaranteed spot, either from the spin or from the snapshot. */
  gtd: boolean;
  points: number;
  streak: number;
  /** ISO timestamp of the last daily spin, or null. */
  lastSpinAt: string | null;
  /** YYYY-MM-DD in the user's local timezone, or null. */
  gamePlayedOn: string | null;
  gameBest: number;
};

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

export type XAccount = {
  handle: string;
  displayName: string;
  /** Deterministic seed for the generated avatar. */
  seed: string;
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
  points: number;
  streak: number;
  /** ISO timestamp of the last daily spin, or null. */
  lastSpinAt: string | null;
  /** YYYY-MM-DD in the user's local timezone, or null. */
  gamePlayedOn: string | null;
  gameBest: number;
};

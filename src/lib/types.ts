export type Squib = {
  /** Token id, zero padded to four digits when displayed. */
  id: number;
  name: string;
  /** What they do. Drives the display copy, not the art. */
  role: string;
  bio: string;
  /** Square render in /public/squibs. */
  photo: string;
  /** Where the shot was taken — small caption detail on the squib page. */
  scene: string;
};

export type RevealProgress = {
  revealed: number;
  total: number;
  allowlisted: number;
  nextMilestone: { allowlisted: number; reveals: number; label: string } | null;
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

export type DailyQuest = {
  id: string;
  title: string;
  detail: string;
  points: number;
};

export type TriviaQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Shown after answering, right or wrong. */
  note: string;
};

export type SpinResult = {
  upgraded: boolean;
  /** Server-decided, echoed back for display. Never computed in the browser. */
  odds: number;
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
  gtd: boolean;
  spinUsed: boolean;
  points: number;
  streak: number;
  /** YYYY-MM-DD in the user's local timezone, or null. */
  lastCheckIn: string | null;
  questDoneOn: string | null;
  triviaDoneOn: string | null;
  gamePlayedOn: string | null;
  gameBest: number;
};

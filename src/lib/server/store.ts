import { POINTS } from "@/lib/constants";
import type { LeaderboardEntry, TaskId, UserProgress } from "@/lib/types";
import { admin } from "./supabase";

/**
 * Every read and write against Supabase lives here. Route handlers stay thin
 * and this file stays the only place that knows the table shapes.
 *
 * // INTEGRATION: points ledger + leaderboard — this IS that integration.
 */

export type ProfileRow = {
  id: string;
  x_user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type LedgerRow = { kind: string; points: number; day: string | null; meta: Record<string, unknown> };

const TASK_KIND: Record<TaskId, string> = {
  follow: "task:follow",
  like: "task:like",
  retweet: "task:retweet",
  quote: "task:quote",
};

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

/* ── profiles ───────────────────────────────────────────────────────────── */

export async function upsertProfile(input: {
  xUserId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  /** ISO date the X account was created, for the account-age rule. */
  xCreatedAt?: string | null;
}): Promise<ProfileRow> {
  const db = admin();
  const { data, error } = await db
    .from("profiles")
    .upsert(
      {
        x_user_id: input.xUserId,
        handle: input.handle,
        display_name: input.displayName,
        avatar_url: input.avatarUrl ?? null,
        x_created_at: input.xCreatedAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "x_user_id" },
    )
    .select("id, x_user_id, handle, display_name, avatar_url")
    .single();

  if (error) fail("upsertProfile", error);
  return data as ProfileRow;
}

export async function getProfile(id: string): Promise<ProfileRow | null> {
  const db = admin();
  const { data, error } = await db
    .from("profiles")
    .select("id, x_user_id, handle, display_name, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (error) fail("getProfile", error);
  return (data as ProfileRow | null) ?? null;
}

/* ── the user's whole state, in one round trip per table ────────────────── */

export async function getUserState(profileId: string): Promise<UserProgress> {
  const db = admin();

  const [profileRes, entryRes, streakRes, ledgerRes, spinRes, gameRes] = await Promise.all([
    db
      .from("profiles")
      .select("handle, display_name, avatar_url, x_created_at")
      .eq("id", profileId)
      .maybeSingle(),
    db
      .from("allowlist_entries")
      .select("evm_address, gtd")
      .eq("profile_id", profileId)
      .maybeSingle(),
    db
      .from("streaks")
      .select("current_streak")
      .eq("profile_id", profileId)
      .maybeSingle(),
    db
      .from("points_ledger")
      .select("kind, points, day, meta")
      .eq("profile_id", profileId),
    // Most recent spin and game, for the two 24 hour cooldown clocks.
    db
      .from("points_ledger")
      .select("created_at")
      .eq("profile_id", profileId)
      .eq("kind", "spin")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("points_ledger")
      .select("created_at")
      .eq("profile_id", profileId)
      .eq("kind", "game")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileRes.error) fail("getUserState/profile", profileRes.error);
  if (entryRes.error) fail("getUserState/entry", entryRes.error);
  if (streakRes.error) fail("getUserState/streak", streakRes.error);
  if (ledgerRes.error) fail("getUserState/ledger", ledgerRes.error);
  if (spinRes.error) fail("getUserState/spin", spinRes.error);
  if (gameRes.error) fail("getUserState/game", gameRes.error);

  const profile = profileRes.data as {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    x_created_at: string | null;
  } | null;
  const entry = entryRes.data as
    | { evm_address: string; gtd: boolean }
    | null;
  const streak = streakRes.data as { current_streak: number } | null;
  const ledger = (ledgerRes.data ?? []) as LedgerRow[];

  const hasKind = (kind: string) => ledger.some((r) => r.kind === kind);

  const lastSpinAt = spinRes.data
    ? (spinRes.data as { created_at: string }).created_at
    : null;
  const lastGameAt = gameRes.data
    ? (gameRes.data as { created_at: string }).created_at
    : null;

  const gameBest = ledger
    .filter((r) => r.kind === "game")
    .reduce((best, r) => Math.max(best, Number(r.meta?.score ?? 0)), 0);

  return {
    x: profile
      ? {
          handle: profile.handle,
          displayName: profile.display_name ?? profile.handle,
          seed: profile.handle,
          avatarUrl: profile.avatar_url,
          joinedAt: profile.x_created_at,
        }
      : null,
    tasks: {
      follow: hasKind(TASK_KIND.follow) ? "done" : "pending",
      like: hasKind(TASK_KIND.like) ? "done" : "pending",
      retweet: hasKind(TASK_KIND.retweet) ? "done" : "pending",
      quote: hasKind(TASK_KIND.quote) ? "done" : "pending",
    },
    evmAddress: entry?.evm_address ?? null,
    allowlisted: !!entry,
    gtd: entry?.gtd ?? false,
    points: ledger.reduce((sum, r) => sum + r.points, 0),
    // Streak here is "spins taken", which is what the flame on the board means.
    streak: streak?.current_streak ?? 0,
    lastSpinAt: lastSpinAt ?? null,
    lastGameAt,
    gameBest,
  };
}

/* ── awards ─────────────────────────────────────────────────────────────── */

/** Award for a one-time X task. Returns points actually granted (0 if repeat). */
export async function awardTask(profileId: string, task: TaskId): Promise<number> {
  const db = admin();
  const { data, error } = await db.rpc("award_points", {
    p_profile: profileId,
    p_kind: TASK_KIND[task],
    p_points: POINTS[task],
    p_day: null,
    p_meta: {},
  });
  if (error) fail("awardTask", error);
  return readAwarded(data);
}

export async function awardDaily(
  profileId: string,
  kind: "game" | "share",
  points: number,
  day: string | null,
  meta: Record<string, unknown> = {},
): Promise<number> {
  const db = admin();
  const { data, error } = await db.rpc("award_points", {
    p_profile: profileId,
    p_kind: kind,
    p_points: points,
    p_day: day,
    p_meta: meta,
  });
  if (error) fail("awardDaily", error);
  return readAwarded(data);
}

/**
 * One spin every 24 hours. The cooldown is checked and the row written inside
 * one locking transaction, so a client that fires the request twice gets one
 * spin and one refusal, never two prizes.
 */
export async function dailySpin(input: {
  profileId: string;
  points: number;
  cooldownHours: number;
  /** false for the "try again" segment, which does not start the cooldown. */
  consume: boolean;
  gtd: boolean;
}): Promise<{ applied: boolean; awarded: number; gtd: boolean; nextAt: string | null }> {
  const db = admin();
  const { data, error } = await db.rpc("daily_spin", {
    p_profile: input.profileId,
    p_points: input.points,
    p_cooldown_hours: input.cooldownHours,
    p_consume: input.consume,
    p_gtd: input.gtd,
  });
  if (error) fail("dailySpin", error);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    awarded: Number(row?.awarded ?? 0),
    gtd: Boolean(row?.won_gtd),
    nextAt: (row?.next_at as string | null) ?? null,
  };
}

/**
 * Award on a rolling cooldown measured from the last award of that kind.
 * Returns applied:false when the caller is still inside the window.
 */
export async function cooldownAward(input: {
  profileId: string;
  kind: "game";
  points: number;
  cooldownHours: number;
  meta?: Record<string, unknown>;
}): Promise<{ applied: boolean; awarded: number; nextAt: string | null }> {
  const db = admin();
  const { data, error } = await db.rpc("cooldown_award", {
    p_profile: input.profileId,
    p_kind: input.kind,
    p_points: input.points,
    p_cooldown_hours: input.cooldownHours,
    p_meta: input.meta ?? {},
  });
  if (error) fail("cooldownAward", error);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    awarded: Number(row?.awarded ?? 0),
    nextAt: (row?.next_at as string | null) ?? null,
  };
}

/** `award_points` returns a one-row table; supabase-js hands it back as an array. */
function readAwarded(data: unknown): number {
  const row = Array.isArray(data) ? data[0] : data;
  if (typeof row === "number") return row;
  return Number((row as { awarded?: number } | null)?.awarded ?? 0);
}

/* ── allowlist ──────────────────────────────────────────────────────────── */

export type SubmitOutcome =
  | { ok: true; rank: number; points: number }
  | { ok: false; reason: "address_taken" | "already_entered" };

export async function submitAllowlist(
  profileId: string,
  evmAddress: string,
): Promise<SubmitOutcome> {
  const db = admin();
  const { error } = await db
    .from("allowlist_entries")
    .insert({ profile_id: profileId, evm_address: evmAddress });

  if (error) {
    // 23505 = unique_violation. Which index tripped tells us which rule broke.
    if (error.code === "23505") {
      const taken = error.message.includes("allowlist_one_per_address");
      return { ok: false, reason: taken ? "address_taken" : "already_entered" };
    }
    fail("submitAllowlist", error);
  }

  const { points, rank } = await getRank(profileId);
  return { ok: true, rank, points };
}

export async function getRank(
  profileId: string,
): Promise<{ points: number; rank: number }> {
  const db = admin();
  const { data, error } = await db
    .from("leaderboard")
    .select("points")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) fail("getRank/points", error);

  const points = Number((data as { points?: number } | null)?.points ?? 0);

  const { count, error: countError } = await db
    .from("leaderboard")
    .select("profile_id", { count: "exact", head: true })
    .gt("points", points);
  if (countError) fail("getRank/count", countError);

  return { points, rank: (count ?? 0) + 1 };
}

/* ── leaderboard ────────────────────────────────────────────────────────── */

export async function getLeaderboardRows(limit = 50): Promise<LeaderboardEntry[]> {
  const db = admin();
  const { data, error } = await db
    .from("leaderboard")
    .select("profile_id, handle, display_name, avatar_url, points, streak")
    .order("points", { ascending: false })
    .order("handle", { ascending: true })
    .limit(limit);
  if (error) fail("getLeaderboardRows", error);

  const rows = (data ?? []) as {
    profile_id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    points: number;
    streak: number;
  }[];

  return rows.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    displayName: r.display_name ?? r.handle,
    avatarUrl: r.avatar_url,
    points: Number(r.points),
    streak: Number(r.streak),
  }));
}

export async function getAllowlistedCount(): Promise<number> {
  const db = admin();
  const { count, error } = await db
    .from("allowlist_entries")
    .select("id", { count: "exact", head: true });
  if (error) fail("getAllowlistedCount", error);
  return count ?? 0;
}

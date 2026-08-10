"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SEAM, client side.
 *
 * Components import from here and never from mock-api directly. Each call hits
 * the matching route handler; if the server answers 503 `{configured:false}`
 * (no Supabase env vars) or the network is gone, it transparently falls back to
 * the in-memory mock. The decision is cached after the first call.
 *
 * That means: the site works with zero configuration, and the moment
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY exist it is running on real data,
 * with no code change and no feature flag to remember.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as mock from "./mock-api";
import type {
  LeaderboardEntry,
  RevealProgress,
  SpinResult,
  Task,
  TaskId,
  UserProgress,
  XAccount,
} from "./types";

export type Backend = "unknown" | "supabase" | "mock";

let backend: Backend = "unknown";
export const getBackend = (): Backend => backend;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** Returns null when the backend isn't available — the caller then mocks it. */
async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (backend === "mock") return null;

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    backend = "mock"; // offline or the route doesn't exist
    return null;
  }

  if (res.status === 503) {
    backend = "mock"; // Supabase not configured
    return null;
  }

  backend = "supabase";

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `http_${res.status}`);
  }
  return (await res.json()) as T;
}

/* ── static content: no backend involved ────────────────────────────────── */

export const getMyTasks = (): Task[] => mock.getMyTasks();
export const getDailyQuest = mock.getDailyQuest;
export const getDailyTrivia = mock.getDailyTrivia;
export const buildShareIntent = mock.buildShareIntent;
export const getVaultMap = mock.getVaultMap;

/* ── session ────────────────────────────────────────────────────────────── */

// INTEGRATION: X OAuth
export async function connectX(): Promise<{
  account: XAccount;
  progress: UserProgress | null;
}> {
  const res = await call<XAccount>("/api/session", { method: "POST" });
  if (!res) return { account: await mock.connectX(), progress: null };

  const me = await call<{ connected: boolean; progress: UserProgress | null }>(
    "/api/me",
  );
  return { account: res, progress: me?.progress ?? null };
}

export async function disconnectX(): Promise<void> {
  await call("/api/session", { method: "DELETE" }).catch(() => null);
}

/** The viewer's server-side state, or null in mock mode / when not connected. */
export async function fetchMe(): Promise<{
  serverAvailable: boolean;
  progress: UserProgress | null;
}> {
  const res = await call<{ connected: boolean; progress: UserProgress | null }>(
    "/api/me",
  );
  if (!res) return { serverAvailable: false, progress: null };
  return { serverAvailable: true, progress: res.progress };
}

/* ── funnel ─────────────────────────────────────────────────────────────── */

// INTEGRATION: task verification
export async function verifyTask(taskId: TaskId): Promise<{
  verified: boolean;
  progress: UserProgress | null;
}> {
  const res = await call<{ verified: boolean; progress: UserProgress }>(
    "/api/tasks",
    { method: "POST", body: JSON.stringify({ taskId }) },
  );
  if (!res) return { verified: (await mock.verifyTask(taskId)).verified, progress: null };
  return { verified: res.verified, progress: res.progress };
}

// INTEGRATION: sybil filtering + points ledger
export async function submitAllowlist(input: {
  handle: string;
  evmAddress: string;
  captchaToken: string;
}): Promise<{ rank: number; points: number; progress: UserProgress | null }> {
  const res = await call<{
    rank: number;
    points: number;
    progress: UserProgress;
  }>("/api/allowlist", {
    method: "POST",
    body: JSON.stringify({
      evmAddress: input.evmAddress,
      captchaToken: input.captchaToken,
    }),
  });

  if (!res) {
    const m = await mock.submitAllowlist(input);
    return { rank: m.rank, points: m.points, progress: null };
  }
  return { rank: res.rank, points: res.points, progress: res.progress };
}

// INTEGRATION: GTD spin (server-authoritative)
export async function requestSpin(): Promise<
  SpinResult & { progress: UserProgress | null }
> {
  const res = await call<{
    upgraded: boolean;
    odds: number;
    progress: UserProgress;
  }>("/api/spin", { method: "POST" });

  if (!res) return { ...(await mock.requestSpin()), progress: null };
  return { upgraded: res.upgraded, odds: res.odds, progress: res.progress };
}

/* ── repeatable earning ─────────────────────────────────────────────────── */

export type EarnKind = "checkin" | "quest" | "trivia" | "game" | "share";

// INTEGRATION: points ledger
export async function earn(
  kind: EarnKind,
  payload: { day: string; score?: number; correct?: boolean },
): Promise<{ awarded: number | null; progress: UserProgress | null }> {
  const res = await call<{
    awarded: number;
    streak?: number;
    progress: UserProgress;
  }>("/api/earn", {
    method: "POST",
    body: JSON.stringify({ kind, ...payload }),
  });

  // awarded:null tells the caller "no server answer — apply the local rule".
  if (!res) return { awarded: null, progress: null };
  return { awarded: res.awarded, progress: res.progress };
}

/* ── reads ──────────────────────────────────────────────────────────────── */

export async function getLeaderboard(you?: {
  handle: string;
  displayName: string;
  points: number;
  streak: number;
}): Promise<{ entries: LeaderboardEntry[]; you: LeaderboardEntry | null }> {
  const res = await call<{
    entries: LeaderboardEntry[];
    you: LeaderboardEntry | null;
  }>("/api/leaderboard");

  if (!res) return mock.getLeaderboard(you);
  return res;
}

export async function getRevealProgress(): Promise<RevealProgress> {
  const res = await call<RevealProgress>("/api/reveal");
  return res ?? (await mock.getRevealProgress());
}

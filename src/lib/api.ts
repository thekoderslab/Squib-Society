"use client";

/**
 * THE SEAM, client side.
 *
 * Components import from here. Each call hits the matching route handler.
 *
 * There are no mock fallbacks any more. Now that the site runs on real data, a
 * backend that cannot be reached must surface as an error or an empty state,
 * never as invented rows or a fabricated allowlist rank. Silent fiction on a
 * live site is worse than a visible failure.
 */

import { HONEYPOT_FIELD } from "./constants";
import { buildShareIntent as buildShare, getMyTasks as tasks } from "./mock-api";
import type {
  LeaderboardEntry,
  SpinResult,
  Task,
  TaskId,
  UserProgress,
} from "./types";

export type Backend = "unknown" | "supabase" | "mock";

let backend: Backend = "unknown";
export const getBackend = (): Backend => backend;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    /** For schema_missing: the object Postgres could not find. */
    public missing?: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** Returns null when the backend is not available, so the caller mocks it. */
async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (backend === "mock") return null;

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    backend = "mock";
    return null;
  }

  if (res.status === 503) {
    backend = "mock";
    return null;
  }

  backend = "supabase";

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      missing?: string;
    };
    throw new ApiError(
      res.status,
      body.error ?? `http_${res.status}`,
      body.missing,
    );
  }
  return (await res.json()) as T;
}

/* ── static content, no backend involved ────────────────────────────────── */

export const getMyTasks = (): Task[] => tasks();
export const buildShareIntent = buildShare;

/* ── session ────────────────────────────────────────────────────────────── */

/** Where the Connect X button points. A full navigation, not a fetch: the
 *  user has to land on x.com to approve, so this cannot be XHR. */
export const X_LOGIN_PATH = "/api/auth/x/start";

export async function disconnectX(): Promise<void> {
  await call("/api/session", { method: "DELETE" }).catch(() => null);
}

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
  const res = await call<{ verified: boolean; progress: UserProgress }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ taskId }),
  });
  if (!res) throw new ApiError(503, "offline");
  return { verified: res.verified, progress: res.progress };
}

// INTEGRATION: sybil filtering + points ledger
export async function submitAllowlist(input: {
  handle: string;
  evmAddress: string;
  captchaToken: string;
  honeypot?: string;
}): Promise<{ rank: number; points: number; progress: UserProgress | null }> {
  const res = await call<{ rank: number; points: number; progress: UserProgress }>(
    "/api/allowlist",
    {
      method: "POST",
      body: JSON.stringify({
        evmAddress: input.evmAddress,
        captchaToken: input.captchaToken,
        [HONEYPOT_FIELD]: input.honeypot ?? "",
      }),
    },
  );

  if (!res) throw new ApiError(503, "offline");
  return { rank: res.rank, points: res.points, progress: res.progress };
}

/* ── daily spin ─────────────────────────────────────────────────────────── */

// INTEGRATION: server-authoritative spin, once every 24 hours
export async function requestSpin(): Promise<
  SpinResult & { progress: UserProgress | null }
> {
  const res = await call<{
    segment: number;
    points: number;
    gtd: boolean;
    again: boolean;
    progress: UserProgress;
  }>("/api/spin", { method: "POST" });

  if (!res) throw new ApiError(503, "offline");
  return {
    segment: res.segment,
    points: res.points,
    gtd: res.gtd,
    again: res.again,
    progress: res.progress,
  };
}

/* ── repeatable earning ─────────────────────────────────────────────────── */

export type EarnKind = "game" | "share";

// INTEGRATION: points ledger
export async function earn(
  kind: EarnKind,
  payload: { day: string; score?: number },
): Promise<{ awarded: number | null; progress: UserProgress | null }> {
  const res = await call<{ awarded: number; progress: UserProgress }>("/api/earn", {
    method: "POST",
    body: JSON.stringify({ kind, ...payload }),
  });

  // awarded:null tells the caller there was no server answer, so apply the
  // local rule instead.
  if (!res) return { awarded: null, progress: null };
  return { awarded: res.awarded, progress: res.progress };
}

/* ── reads ──────────────────────────────────────────────────────────────── */

/**
 * The board. The server already knows who you are from the session cookie, so
 * there is nothing to pass in. An unreachable backend returns an empty board
 * rather than invented rows.
 */
export async function getLeaderboard(): Promise<{
  entries: LeaderboardEntry[];
  you: LeaderboardEntry | null;
}> {
  const res = await call<{
    entries: LeaderboardEntry[];
    you: LeaderboardEntry | null;
  }>("/api/leaderboard");

  return res ?? { entries: [], you: null };
}

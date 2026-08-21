"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchMe } from "@/lib/api";
import { POINTS, STORAGE_KEY } from "@/lib/constants";
import type { TaskId, TaskStatus, UserProgress, XAccount } from "@/lib/types";

const EMPTY: UserProgress = {
  x: null,
  tasks: { follow: "pending", like: "pending", retweet: "pending", quote: "pending" },
  evmAddress: null,
  allowlisted: false,
  gtd: false,
  points: 0,
  rank: null,
  streak: 0,
  lastSpinAt: null,
  lastGameAt: null,
  gameBest: 0,
};

type Ctx = {
  /** False during the first client render. Render neutral placeholders until true. */
  hydrated: boolean;
  /**
   * "server" once Supabase has answered. The ledger is then authoritative and
   * nothing is written to localStorage. "local" is the zero-config fallback.
   */
  mode: "local" | "server";
  progress: UserProgress;
  /** Replace local state with what the server just returned. */
  applyServerProgress: (p: UserProgress) => void;
  setX: (x: XAccount | null) => void;
  setTask: (id: TaskId, status: TaskStatus) => void;
  setEvmAddress: (address: string) => void;
  markAllowlisted: () => void;
  recordSpin: (points: number, gtd: boolean) => void;
  recordGame: (score: number) => number;
  reset: () => void;
  baseTasksDone: boolean;
};

const ProgressContext = createContext<Ctx | null>(null);

function load(): UserProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    // Merge over EMPTY so a shape change never crashes an existing visitor.
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<UserProgress>) };
  } catch {
    return EMPTY;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<"local" | "server">("local");

  useEffect(() => {
    let live = true;

    // Paint from localStorage first so the UI is never blank, then ask the
    // server. If Supabase is configured its answer wins outright, because a
    // stale local copy must never be able to inflate a points total.
    setProgress(load());
    setHydrated(true);

    fetchMe()
      .then(({ serverAvailable, progress: server }) => {
        if (!live || !serverAvailable) return;
        setMode("server");
        setProgress(server ?? EMPTY);
      })
      .catch(() => {
        /* stay in local mode */
      });

    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || mode === "server") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* private mode, the session just will not persist */
    }
  }, [progress, hydrated, mode]);

  const patch = useCallback(
    (fn: (p: UserProgress) => UserProgress) => setProgress((p) => fn(p)),
    [],
  );

  const applyServerProgress = useCallback((p: UserProgress) => {
    setMode("server");
    setProgress(p);
  }, []);

  const setX = useCallback((x: XAccount | null) => patch((p) => ({ ...p, x })), [patch]);

  const setTask = useCallback(
    (id: TaskId, status: TaskStatus) =>
      patch((p) => {
        if (p.tasks[id] === status) return p;
        const wasDone = p.tasks[id] === "done";
        const delta = !wasDone && status === "done" ? POINTS[id] : 0;
        return {
          ...p,
          tasks: { ...p.tasks, [id]: status },
          points: p.points + delta,
        };
      }),
    [patch],
  );

  const setEvmAddress = useCallback(
    (address: string) => patch((p) => ({ ...p, evmAddress: address })),
    [patch],
  );

  const markAllowlisted = useCallback(
    () => patch((p) => ({ ...p, allowlisted: true })),
    [patch],
  );

  const recordSpin = useCallback(
    (points: number, gtd: boolean) =>
      patch((p) => ({
        ...p,
        lastSpinAt: new Date().toISOString(),
        streak: p.streak + 1,
        gtd: p.gtd || gtd,
        points: p.points + points,
      })),
    [patch],
  );

  const recordGame = useCallback(
    (score: number): number => {
      const awarded = Math.min(score * POINTS.gamePerCatch, POINTS.gameDailyCap);
      patch((p) => ({
        ...p,
        lastGameAt: new Date().toISOString(),
        gameBest: Math.max(p.gameBest, score),
        points: p.points + awarded,
      }));
      return awarded;
    },
    [patch],
  );

  const reset = useCallback(() => setProgress(EMPTY), []);

  const baseTasksDone =
    progress.tasks.follow === "done" &&
    progress.tasks.like === "done" &&
    progress.tasks.retweet === "done";

  const value = useMemo<Ctx>(
    () => ({
      hydrated,
      mode,
      applyServerProgress,
      progress,
      setX,
      setTask,
      setEvmAddress,
      markAllowlisted,
      recordSpin,
      recordGame,
      reset,
      baseTasksDone,
    }),
    [
      hydrated,
      mode,
      applyServerProgress,
      progress,
      setX,
      setTask,
      setEvmAddress,
      markAllowlisted,
      recordSpin,
      recordGame,
      reset,
      baseTasksDone,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

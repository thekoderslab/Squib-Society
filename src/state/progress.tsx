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

import { POINTS, STORAGE_KEY } from "@/lib/constants";
import { daysBetween, localDayKey } from "@/lib/dates";
import type { TaskId, TaskStatus, UserProgress, XAccount } from "@/lib/types";

const EMPTY: UserProgress = {
  x: null,
  tasks: { follow: "pending", like: "pending", retweet: "pending", quote: "pending" },
  evmAddress: null,
  allowlisted: false,
  gtd: false,
  spinUsed: false,
  points: 0,
  streak: 0,
  lastCheckIn: null,
  questDoneOn: null,
  triviaDoneOn: null,
  gamePlayedOn: null,
  gameBest: 0,
};

type Ctx = {
  /** False during the first client render — render neutral placeholders until true. */
  hydrated: boolean;
  progress: UserProgress;
  setX: (x: XAccount | null) => void;
  setTask: (id: TaskId, status: TaskStatus) => void;
  setEvmAddress: (address: string) => void;
  markAllowlisted: () => void;
  recordSpin: (upgraded: boolean) => void;
  /** Returns the points awarded, or 0 if already checked in today. */
  doCheckIn: () => number;
  completeQuest: () => void;
  completeTrivia: (correct: boolean) => void;
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

  useEffect(() => {
    setProgress(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* private mode — the session just won't persist */
    }
  }, [progress, hydrated]);

  const patch = useCallback(
    (fn: (p: UserProgress) => UserProgress) => setProgress((p) => fn(p)),
    [],
  );

  const setX = useCallback(
    (x: XAccount | null) => patch((p) => ({ ...p, x })),
    [patch],
  );

  const setTask = useCallback(
    (id: TaskId, status: TaskStatus) =>
      patch((p) => {
        if (p.tasks[id] === status) return p;
        const wasDone = p.tasks[id] === "done";
        const nowDone = status === "done";
        const delta = !wasDone && nowDone ? POINTS[id] : 0;
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
    (upgraded: boolean) =>
      patch((p) => ({ ...p, spinUsed: true, gtd: p.gtd || upgraded })),
    [patch],
  );

  /**
   * Check-in is the workhorse of the retention loop: base points plus a
   * per-day streak bonus, and a miss resets the streak to 1.
   */
  const doCheckIn = useCallback((): number => {
    const today = localDayKey();
    if (progress.lastCheckIn === today) return 0;

    // Computed out here, not inside the updater: state updaters must stay pure
    // (React re-invokes them), and the caller needs the number to display.
    const gap = daysBetween(progress.lastCheckIn, today);
    const streak = gap === 1 ? progress.streak + 1 : 1;
    const bonus = Math.min(
      (streak - 1) * POINTS.streakBonusPerDay,
      POINTS.streakBonusCap,
    );
    const awarded = POINTS.checkIn + bonus;

    patch((p) =>
      p.lastCheckIn === today
        ? p
        : { ...p, lastCheckIn: today, streak, points: p.points + awarded },
    );
    return awarded;
  }, [patch, progress.lastCheckIn, progress.streak]);

  const completeQuest = useCallback(() => {
    const today = localDayKey();
    patch((p) =>
      p.questDoneOn === today
        ? p
        : { ...p, questDoneOn: today, points: p.points + POINTS.dailyQuest },
    );
  }, [patch]);

  const completeTrivia = useCallback(
    (correct: boolean) => {
      const today = localDayKey();
      patch((p) =>
        p.triviaDoneOn === today
          ? p
          : {
              ...p,
              triviaDoneOn: today,
              points: p.points + (correct ? POINTS.trivia : 0),
            },
      );
    },
    [patch],
  );

  const recordGame = useCallback(
    (score: number): number => {
      const today = localDayKey();
      if (progress.gamePlayedOn === today) return 0;
      const awarded = Math.min(score * POINTS.gamePerCatch, POINTS.gameDailyCap);
      patch((p) =>
        p.gamePlayedOn === today
          ? p
          : {
              ...p,
              gamePlayedOn: today,
              gameBest: Math.max(p.gameBest, score),
              points: p.points + awarded,
            },
      );
      return awarded;
    },
    [patch, progress.gamePlayedOn],
  );

  const reset = useCallback(() => setProgress(EMPTY), []);

  const baseTasksDone =
    progress.tasks.follow === "done" &&
    progress.tasks.like === "done" &&
    progress.tasks.retweet === "done";

  const value = useMemo<Ctx>(
    () => ({
      hydrated,
      progress,
      setX,
      setTask,
      setEvmAddress,
      markAllowlisted,
      recordSpin,
      doCheckIn,
      completeQuest,
      completeTrivia,
      recordGame,
      reset,
      baseTasksDone,
    }),
    [
      hydrated,
      progress,
      setX,
      setTask,
      setEvmAddress,
      markAllowlisted,
      recordSpin,
      doCheckIn,
      completeQuest,
      completeTrivia,
      recordGame,
      reset,
      baseTasksDone,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

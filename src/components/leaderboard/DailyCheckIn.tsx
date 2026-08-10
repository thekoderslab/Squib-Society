"use client";

import { useMemo, useState } from "react";

import { POINTS } from "@/lib/constants";
import { checkIn } from "@/lib/mock-api";
import { addDays, dayKeyToDate, localDayKey, recentDays } from "@/lib/dates";
import { useProgress } from "@/state/progress";
import Button from "../ui/Button";
import { FlameIcon } from "../funnel/icons";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The workhorse of the retention loop. Points for showing up, a multiplier for
 * showing up again, and a reset if you don't. Deliberately not weighted by
 * follower count — returning beats reach.
 */
export default function DailyCheckIn() {
  const { hydrated, progress, doCheckIn } = useProgress();
  const [busy, setBusy] = useState(false);
  const [awarded, setAwarded] = useState<number | null>(null);

  const today = localDayKey();
  const checkedInToday = progress.lastCheckIn === today;

  /** Which of the last 7 days are covered by the current streak. */
  const doneDays = useMemo(() => {
    const set = new Set<string>();
    if (!progress.lastCheckIn) return set;
    const last = dayKeyToDate(progress.lastCheckIn);
    for (let i = 0; i < progress.streak; i++) {
      set.add(localDayKey(addDays(last, -i)));
    }
    return set;
  }, [progress.lastCheckIn, progress.streak]);

  const week = useMemo(() => recentDays(7), []);

  const nextBonus = Math.min(
    progress.streak * POINTS.streakBonusPerDay,
    POINTS.streakBonusCap,
  );

  async function handleCheckIn() {
    setBusy(true);
    try {
      // INTEGRATION: points ledger — write the check-in server-side
      await checkIn();
      const points = doCheckIn();
      setAwarded(points);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-card border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">
            Daily check-in
          </h3>
          <p className="mt-1 text-sm text-ink/55">
            +{POINTS.checkIn} base, +{POINTS.streakBonusPerDay} per streak day.
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 ${
            progress.streak > 0 && hydrated
              ? "bg-flare/10 text-flare"
              : "bg-ink/[0.06] text-ink/45"
          }`}
        >
          <FlameIcon
            className={`h-4 w-4 ${
              checkedInToday && hydrated ? "animate-flicker" : ""
            }`}
          />
          <span className="font-mono text-sm font-bold tabular">
            {hydrated ? progress.streak : 0}
          </span>
        </span>
      </div>

      <ul className="mt-5 flex items-center justify-between gap-1.5">
        {week.map((key) => {
          const d = dayKeyToDate(key);
          const isToday = key === today;
          const done = hydrated && doneDays.has(key);
          return (
            <li key={key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] text-ink/35">
                {DAY_LETTERS[d.getDay()]}
              </span>
              <span
                className={`grid aspect-square w-full max-w-9 place-items-center rounded-lg text-[11px] font-medium ${
                  done
                    ? "bg-squib text-white"
                    : isToday
                      ? "border-2 border-dashed border-squib/50 bg-squib-wash text-ink/50"
                      : "bg-ink/[0.05] text-ink/30"
                }`}
              >
                <span className="font-mono tabular">{d.getDate()}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-5">
        {hydrated && checkedInToday ? (
          <p className="rounded-squib bg-squib-wash px-4 py-3 text-center text-sm text-squib-deep">
            {awarded !== null ? (
              <>
                Checked in. <span className="font-mono font-bold">+{awarded}</span>{" "}
                points.
              </>
            ) : (
              <>Already checked in today. Tomorrow is worth +{nextBonus} more.</>
            )}
          </p>
        ) : (
          <Button
            onClick={handleCheckIn}
            loading={busy}
            disabled={!hydrated}
            className="w-full"
          >
            {busy ? "Checking in…" : "Check in"}
          </Button>
        )}
      </div>
    </div>
  );
}

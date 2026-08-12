"use client";

import { useEffect, useMemo, useState } from "react";

import { getLeaderboard } from "@/lib/api";

import type { LeaderboardEntry } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Avatar from "../art/Avatar";
import { FlameIcon } from "../funnel/icons";

const VISIBLE = 12;
/** Rows above this get the green rank. The exact number is never shown. */
const TOP_CUT = 20;

export default function LeaderboardTable() {
  const { hydrated, progress } = useProgress();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [you, setYou] = useState<LeaderboardEntry | null>(null);
  const [expanded, setExpanded] = useState(false);

  const me = useMemo(
    () =>
      progress.x
        ? {
            handle: progress.x.handle,
            displayName: progress.x.displayName,
            points: progress.points,
            streak: progress.streak,
          }
        : undefined,
    [progress.x, progress.points, progress.streak],
  );

  useEffect(() => {
    if (!hydrated) return;
    let live = true;
    // INTEGRATION: points ledger + leaderboard
    getLeaderboard(me).then((res) => {
      if (!live) return;
      setEntries(res.entries);
      setYou(res.you);
    });
    return () => {
      live = false;
    };
  }, [hydrated, me]);

  const shown = entries?.slice(0, expanded ? 25 : VISIBLE) ?? [];
  const youOffscreen = you && you.rank > shown.length;

  return (
    <div className="overflow-hidden rounded-card border-2 border-hairline bg-surface shadow-card">
      <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b-2 border-hairline px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 sm:px-5">
        <span>Rank</span>
        <span>Handle</span>
        <span className="text-right">Points</span>
      </div>

      {!entries ? (
        <ul className="divide-y-2 divide-hairline">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="px-4 py-3.5 sm:px-5">
              <div className="h-8 w-full animate-pulse rounded-none bg-ink/[0.04]" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y-2 divide-hairline">
          {shown.map((e) => (
            <Row key={e.handle} entry={e} />
          ))}
        </ul>
      )}

      {/* Your row, pinned to the bottom when it isn't already on screen. */}
      {youOffscreen ? (
        <div className="sticky bottom-0 border-t-2 border-squib bg-squib-wash">
          <Row entry={you} pinned />
        </div>
      ) : null}

      {entries && entries.length > VISIBLE ? (
        <div className="border-t-2 border-hairline px-4 py-3 text-center sm:px-5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-none px-3 py-1.5 text-sm font-medium text-ink/60 transition hover:text-ink"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Row({ entry, pinned }: { entry: LeaderboardEntry; pinned?: boolean }) {
  const inTheMoney = entry.rank <= TOP_CUT;
  return (
    <div
      className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 sm:px-5 ${
        entry.isYou && !pinned ? "bg-squib-wash" : ""
      }`}
    >
      <span
        className={`font-mono text-sm font-bold tabular ${
          inTheMoney ? "text-squib-deep" : "text-ink/40"
        }`}
      >
        {String(entry.rank).padStart(2, "0")}
      </span>

      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar handle={entry.handle} className="h-8 w-8" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {entry.isYou ? "You" : entry.displayName}
            </span>
            {entry.isYou ? (
              <span className="rounded-none bg-squib px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                you
              </span>
            ) : null}
          </span>
          <span className="block truncate font-mono text-xs text-ink/45">
            @{entry.handle}
          </span>
        </span>
      </span>

      <span className="flex items-center justify-end gap-3">
        {entry.streak > 0 ? (
          <span className="hidden items-center gap-1 text-ink/40 sm:flex">
            <FlameIcon className="h-3.5 w-3.5" />
            <span className="font-mono text-xs tabular">{entry.streak}</span>
          </span>
        ) : null}
        <span className="font-mono text-sm font-bold tabular">
          {entry.points.toLocaleString("en-US")}
        </span>
      </span>
    </div>
  );
}

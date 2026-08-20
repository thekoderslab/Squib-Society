"use client";

import { useCallback, useEffect, useState } from "react";

import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Avatar from "../art/Avatar";
import SquibHead from "../art/SquibHead";
import { FlameIcon } from "../funnel/icons";

const VISIBLE = 12;
/** Rows above this get the green rank. The exact number is never shown. */
const TOP_CUT = 20;

export default function LeaderboardTable() {
  const { progress } = useProgress();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [you, setYou] = useState<LeaderboardEntry | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await getLeaderboard();
      setEntries(res.entries);
      setYou(res.you);
    } catch {
      // Without this the promise rejected into nothing, entries stayed null,
      // and the skeleton span forever with no way to tell it had failed.
      setEntries(null);
      setFailed(true);
    }
  }, []);

  // Fetch straight away. The board does not depend on the session, so waiting
  // for /api/me to answer first only added a round trip to first paint.
  useEffect(() => {
    void load();
  }, [load]);

  // Refresh once the viewer's own total moves, so their row is not stale.
  useEffect(() => {
    if (!progress.x) return;
    void load();
  }, [progress.x, progress.points, load]);

  const shown = entries?.slice(0, expanded ? 25 : VISIBLE) ?? [];
  const youOffscreen = you && you.rank > shown.length;

  return (
    <div className="overflow-hidden border-2 border-hairline bg-surface shadow-card">
      <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b-2 border-hairline px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 sm:px-5">
        <span>Rank</span>
        <span>Handle</span>
        <span className="text-right">Points</span>
      </div>

      {failed ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-ink/60">The board did not load.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 border-2 border-hairline bg-cream px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
          >
            Try again
          </button>
        </div>
      ) : !entries ? (
        <div className="grid place-items-center gap-3 px-5 py-14">
          <SquibHead size={96} className="h-10 w-10 animate-spin object-contain" />
          <p className="stamp text-ink/40">Loading the board</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-ink/60">
            Nobody on the board yet. Take a spin and you are first.
          </p>
        </div>
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
            className="px-3 py-1.5 text-sm font-medium text-ink/60 transition hover:text-ink"
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
        <Avatar handle={entry.handle} src={entry.avatarUrl} className="h-8 w-8" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {entry.isYou ? "You" : entry.displayName}
            </span>
            {entry.isYou ? (
              <span className="bg-squib px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
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

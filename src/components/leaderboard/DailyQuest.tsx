"use client";

import { useEffect, useState } from "react";

import { earn, getDailyQuest } from "@/lib/api";
import { localDayKey } from "@/lib/dates";
import type { DailyQuest as Quest } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Button from "../ui/Button";
import Chip, { Check } from "../ui/Chip";

export default function DailyQuestCard() {
  const { hydrated, progress, completeQuest, applyServerProgress } = useProgress();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [busy, setBusy] = useState(false);

  // Resolved on the client so the rotating quest can't be baked into the HTML
  // at build time and go stale.
  useEffect(() => setQuest(getDailyQuest()), []);

  const done = hydrated && progress.questDoneOn === localDayKey();

  async function handleDone() {
    setBusy(true);
    try {
      // INTEGRATION: task verification — quest platform confirms, then the
      // ledger awards. Self-reporting is fine for a soft daily; the streak and
      // the leaderboard are what actually carry weight.
      const { progress: server } = await earn("quest", { day: localDayKey() });
      if (server) applyServerProgress(server);
      else completeQuest();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-card border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-squib-deep">
          Today&apos;s quest
        </p>
        {done ? (
          <Chip tone="green">
            <Check /> Done
          </Chip>
        ) : (
          <Chip tone="outline" className="font-mono">
            +{quest?.points ?? 30}
          </Chip>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">
        {quest ? quest.title : "Loading today's quest"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/60 text-pretty">
        {quest ? quest.detail : "One small thing, fresh every day."}
      </p>

      <div className="mt-auto pt-5">
        {done ? (
          <p className="rounded-squib bg-squib-wash px-4 py-3 text-center text-sm text-squib-deep">
            Nice. New quest at midnight, your time.
          </p>
        ) : (
          <Button
            onClick={handleDone}
            loading={busy}
            disabled={!hydrated || !quest}
            variant="quiet"
            className="w-full"
          >
            {busy ? "Confirming…" : "I did it"}
          </Button>
        )}
      </div>
    </div>
  );
}

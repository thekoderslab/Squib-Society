"use client";

import { useEffect, useState } from "react";

import { earn, getDailyTrivia } from "@/lib/api";
import { POINTS } from "@/lib/constants";
import { localDayKey } from "@/lib/dates";
import type { TriviaQuestion } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Chip, { Check } from "../ui/Chip";

/** Cheap to run, and it quietly filters for people who read anything. */
export default function LoreTrivia() {
  const { hydrated, progress, completeTrivia, applyServerProgress } = useProgress();
  const [q, setQ] = useState<TriviaQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => setQ(getDailyTrivia()), []);

  const answeredToday = hydrated && progress.triviaDoneOn === localDayKey();
  const revealed = picked !== null || answeredToday;
  const correct = q && picked !== null ? picked === q.answerIndex : null;

  async function pick(i: number) {
    if (revealed || !q) return;
    setPicked(i);
    const correct = i === q.answerIndex;
    // Optimistic locally, authoritative on the server — a wrong answer still
    // burns the day either way.
    completeTrivia(correct);
    const { progress: server } = await earn("trivia", {
      day: localDayKey(),
      correct,
    });
    if (server) applyServerProgress(server);
  }

  return (
    <div className="flex h-full flex-col rounded-card border-2 border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-squib-deep">
          Lore check
        </p>
        {answeredToday && picked === null ? (
          <Chip tone="neutral">Answered</Chip>
        ) : (
          <Chip tone="outline" className="font-mono">
            +{POINTS.trivia}
          </Chip>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
        {q ? q.prompt : "Loading today's question"}
      </h3>

      <ul className="mt-4 space-y-2">
        {(q?.options ?? []).map((opt, i) => {
          const isAnswer = q && i === q.answerIndex;
          const isPicked = picked === i;
          const tone = !revealed
            ? "border-hairline bg-cream hover:border-ink/30"
            : isAnswer
              ? "border-squib bg-squib-wash text-squib-deep"
              : isPicked
                ? "border-flare/40 bg-flare/[0.05] text-flare"
                : "border-hairline bg-cream text-ink/40";
          return (
            <li key={opt}>
              <button
                type="button"
                onClick={() => pick(i)}
                disabled={revealed || !hydrated}
                aria-pressed={isPicked}
                className={`w-full rounded-squib border px-4 py-2.5 text-left text-sm transition disabled:cursor-default ${tone}`}
              >
                <span className="flex items-center justify-between gap-2">
                  {opt}
                  {revealed && isAnswer ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4">
        {revealed && q ? (
          <p className="text-sm leading-relaxed text-ink/60">
            {picked !== null ? (
              <span
                className={`font-medium ${correct ? "text-squib-deep" : "text-flare"}`}
              >
                {correct ? "Correct. " : "Not quite. "}
              </span>
            ) : null}
            {q.note}
          </p>
        ) : (
          <p className="text-xs text-ink/40">One question a day. No second guesses.</p>
        )}
      </div>
    </div>
  );
}

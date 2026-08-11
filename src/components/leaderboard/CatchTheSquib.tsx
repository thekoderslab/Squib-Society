"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { earn } from "@/lib/api";
import { POINTS } from "@/lib/constants";
import { localDayKey } from "@/lib/dates";
import { useProgress } from "@/state/progress";
import SquibHead from "../art/SquibHead";
import Button from "../ui/Button";
import Chip from "../ui/Chip";

const CELLS = 9;
const ROUND_SECONDS = 20;
const POP_MS = 900;

/**
 * The small daily game. Deliberately short and capped — it should be a reason
 * to open the page, not a grind that lets the most patient person buy rank.
 */
export default function CatchTheSquib() {
  const { hydrated, progress, recordGame, applyServerProgress } = useProgress();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [awarded, setAwarded] = useState<number | null>(null);
  const caught = useRef(false);

  const playedToday = hydrated && progress.gamePlayedOn === localDayKey();

  const stop = useCallback(() => {
    setPhase("over");
    setActive(null);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    const tick = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tick);
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const pop = window.setInterval(() => {
      caught.current = false;
      setActive(Math.floor(Math.random() * CELLS));
      window.setTimeout(() => setActive(null), POP_MS - 120);
    }, POP_MS);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(pop);
    };
  }, [phase, stop]);

  // Award once, when the round ends. The server caps and re-derives the
  // points from the score, so a tampered score can't mint more than the cap.
  useEffect(() => {
    if (phase !== "over" || awarded !== null) return;
    setAwarded(recordGame(score));
    earn("game", { day: localDayKey(), score })
      .then(({ awarded: serverAwarded, progress: server }) => {
        if (!server) return;
        applyServerProgress(server);
        setAwarded(serverAwarded);
      })
      .catch(() => {
        /* keep the local award */
      });
  }, [phase, score, awarded, recordGame, applyServerProgress]);

  function start() {
    setScore(0);
    setLeft(ROUND_SECONDS);
    setAwarded(null);
    setPhase("playing");
  }

  function hit(i: number) {
    if (phase !== "playing" || i !== active || caught.current) return;
    caught.current = true;
    setScore((s) => s + 1);
    setActive(null);
  }

  return (
    <div className="flex h-full flex-col rounded-card border-2 border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-squib-deep">
          Catch the squib
        </p>
        {phase === "playing" ? (
          <Chip tone="green" className="font-mono tabular">
            {left}s · {score}
          </Chip>
        ) : (
          <Chip tone="outline" className="font-mono">
            +{POINTS.gamePerCatch}/catch
          </Chip>
        )}
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-2"
        role="group"
        aria-label="Catch the squib game board"
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => hit(i)}
            disabled={phase !== "playing"}
            aria-label={active === i ? "Squib is up — catch it" : "Empty hole"}
            className="relative aspect-square overflow-hidden rounded-squib border-2 border-hairline bg-cream disabled:cursor-default"
          >
            {active === i ? (
              <SquibHead
                size={160}
                className="absolute inset-x-[10%] bottom-[6%] h-[80%] w-[80%] animate-pop object-contain"
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4">
        {playedToday && phase !== "playing" ? (
          <p className="rounded-squib bg-squib-wash px-4 py-3 text-center text-sm text-squib-deep">
            {awarded !== null ? (
              <>
                Caught {score}.{" "}
                <span className="font-mono font-bold">+{awarded}</span> points.
              </>
            ) : (
              <>
                Played today. Best so far:{" "}
                <span className="font-mono font-bold">{progress.gameBest}</span>.
              </>
            )}
          </p>
        ) : (
          <Button
            onClick={start}
            variant="quiet"
            disabled={!hydrated || phase === "playing"}
            className="w-full"
          >
            {phase === "playing" ? "Go" : "Play (once a day)"}
          </Button>
        )}
      </div>
    </div>
  );
}

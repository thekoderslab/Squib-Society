"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { earn } from "@/lib/api";
import { GAME, POINTS } from "@/lib/constants";
import { formatCountdown, localDayKey, readyAt } from "@/lib/dates";
import { useProgress } from "@/state/progress";
import SquibHead from "../art/SquibHead";
import Button from "../ui/Button";
import Chip from "../ui/Chip";

/**
 * The daily game.
 *
 * Four states, and the board is never empty in three of them:
 *   idle      every hole holds a squib behind a blur, with the CTA on top
 *   playing   the blur lifts, holes go empty, squibs pop one at a time
 *   over      score and points, back over the blurred board
 *   cooling   the 24 hour clock, counted from the moment the round ended
 *
 * Short and capped on purpose, so it stays a reason to open the page rather
 * than a grind that the most patient person wins.
 */
export default function CatchTheSquib() {
  const { hydrated, progress, recordGame, applyServerProgress } = useProgress();

  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  // Annotated: GAME is `as const`, so the seed's type is the literal 20 and
  // an unannotated useState would refuse every decrement.
  const [left, setLeft] = useState<number>(GAME.roundSeconds);
  const [awarded, setAwarded] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const caught = useRef(false);

  const connected = !!progress.x;
  const ready = readyAt(progress.lastGameAt, GAME.cooldownHours);
  const cooling = hydrated && ready !== null && ready > now && phase !== "playing";

  const stop = useCallback(() => {
    setPhase("over");
    setActive(null);
  }, []);

  // Round timer and the pop loop.
  useEffect(() => {
    if (phase !== "playing") return;

    const tick = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const timeouts: number[] = [];
    const pop = window.setInterval(() => {
      caught.current = false;
      setActive(Math.floor(Math.random() * GAME.cells));
      timeouts.push(window.setTimeout(() => setActive(null), GAME.popMs - 120));
    }, GAME.popMs);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(pop);
      timeouts.forEach(window.clearTimeout);
    };
  }, [phase, stop]);

  // Award once, when the round ends. The server re-scores and caps it, so a
  // tampered score cannot mint more than the cap.
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

  // Only tick the clock while it is actually counting down.
  useEffect(() => {
    if (!cooling) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [cooling]);

  function start() {
    if (!connected || cooling) return;
    setScore(0);
    setLeft(GAME.roundSeconds);
    setAwarded(null);
    setPhase("playing");
  }

  function hit(i: number) {
    if (phase !== "playing" || i !== active || caught.current) return;
    caught.current = true;
    setScore((s) => s + 1);
    setActive(null);
  }

  const playing = phase === "playing";

  return (
    <div className="flex h-full flex-col border-2 border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="stamp text-squib-deep">Catch the squib</p>
        {playing ? (
          <Chip tone="green" className="tabular">
            {left}s / {score}
          </Chip>
        ) : (
          <Chip tone="outline">+{POINTS.gamePerCatch} a catch</Chip>
        )}
      </div>

      <div className="relative mt-4">
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Catch the squib game board"
        >
          {Array.from({ length: GAME.cells }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => hit(i)}
              disabled={!playing}
              tabIndex={playing ? 0 : -1}
              aria-label={
                playing
                  ? active === i
                    ? "Squib is up, catch it"
                    : "Empty hole"
                  : "Game board"
              }
              className="relative aspect-square overflow-hidden border-2 border-hairline bg-cream disabled:cursor-default"
            >
              {/* Idle and after the round every hole holds a squib, so the board
                  reads as a game rather than nine empty boxes. Mid-round only
                  the live one shows, which is the whole point of it. */}
              {playing ? (
                active === i ? (
                  <SquibHead
                    size={160}
                    className="absolute inset-x-[10%] bottom-[6%] h-[80%] w-[80%] animate-pop object-contain"
                  />
                ) : null
              ) : (
                <SquibHead
                  size={160}
                  className="absolute inset-[12%] h-[76%] w-[76%] object-contain opacity-70"
                />
              )}
            </button>
          ))}
        </div>

        {!playing ? (
          <div className="absolute inset-0 grid place-items-center bg-cream/55 px-4 text-center backdrop-blur-[3px]">
            {!hydrated ? null : cooling ? (
              <div>
                <p className="stamp text-ink/50">Next game in</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular">
                  {formatCountdown(ready! - now)}
                </p>
                {awarded !== null ? (
                  <p className="mt-2 text-sm text-ink/65">
                    You caught {score} and took{" "}
                    <span className="font-mono font-bold">+{awarded}</span>.
                  </p>
                ) : progress.gameBest > 0 ? (
                  <p className="mt-2 text-sm text-ink/55">
                    Best so far{" "}
                    <span className="font-mono font-bold">{progress.gameBest}</span>.
                  </p>
                ) : null}
              </div>
            ) : phase === "over" ? (
              <div>
                <p className="font-mono text-3xl font-bold tabular">
                  +{awarded ?? 0}
                </p>
                <p className="mt-1 text-sm text-ink/65">
                  Caught {score}. Back again in {GAME.cooldownHours} hours.
                </p>
              </div>
            ) : (
              <div>
                <Button onClick={start} disabled={!connected} size="lg">
                  Play to get more points
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-ink/60">
                  {connected
                    ? GAME.roundSeconds +
                      " seconds, one go every " +
                      GAME.cooldownHours +
                      " hours."
                    : "Connect X on the allowlist page to play."}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <p className="mt-auto pt-4 text-center text-xs text-ink/45">
        Tap a squib the moment it shows up. Miss it and it ducks back down.
      </p>
    </div>
  );
}

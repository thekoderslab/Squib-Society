"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { requestSpin } from "@/lib/api";
import { DAILY_SPIN } from "@/lib/constants";
import { useProgress } from "@/state/progress";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import { XLogo } from "../funnel/icons";

const SEGMENTS = DAILY_SPIN.prizes.length;
const SEG_DEG = 360 / SEGMENTS;
const COOLDOWN_MS = DAILY_SPIN.cooldownHours * 60 * 60 * 1000;

function readyAt(lastSpinAt: string | null): number | null {
  if (!lastSpinAt) return null;
  const t = Date.parse(lastSpinAt);
  return Number.isNaN(t) ? null : t + COOLDOWN_MS;
}

function formatLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * One spin every 24 hours, points only.
 *
 * // INTEGRATION: server-authoritative spin. requestSpin() decides the segment
 * and records the timestamp before it answers, so a client that reloads or
 * replays the request cannot spin twice. The wheel is only told where to stop.
 */
export default function DailySpin() {
  const { hydrated, progress, recordSpin, applyServerProgress } = useProgress();
  const reduce = useReducedMotion();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const connected = !!progress.x;
  const ready = readyAt(progress.lastSpinAt);
  const locked = hydrated && ready !== null && ready > now;

  // Tick only while the cooldown is actually running.
  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  async function handleSpin() {
    if (spinning || locked || !connected) return;
    setSpinning(true);
    setWon(null);

    try {
      const res = await requestSpin();
      const landing =
        360 * 5 + (360 - res.segment * SEG_DEG - SEG_DEG / 2) + rotation;
      setRotation(landing);

      window.setTimeout(
        () => {
          if (res.progress) applyServerProgress(res.progress);
          else recordSpin(res.points);
          setWon(res.points);
          setNow(Date.now());
          setSpinning(false);
        },
        reduce ? 150 : 3200,
      );
    } catch {
      setSpinning(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-2 border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="stamp text-squib-deep">Daily spin</p>
        {locked ? (
          <Chip tone="neutral" className="tabular">
            {formatLeft(ready! - now)}
          </Chip>
        ) : (
          <Chip tone="outline">Once a day</Chip>
        )}
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[3px]"
          >
            <svg viewBox="0 0 18 16" className="h-4 w-[18px]">
              <path d="M9 16 0 0h18L9 16Z" fill="#17150F" />
            </svg>
          </span>

          <motion.svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            aria-hidden
            animate={{ rotate: rotation }}
            transition={{ duration: reduce ? 0.15 : 3.2, ease: [0.16, 0.9, 0.25, 1] }}
          >
            {DAILY_SPIN.prizes.map((prize, i) => {
              const a0 = (i * SEG_DEG - 90) * (Math.PI / 180);
              const a1 = ((i + 1) * SEG_DEG - 90) * (Math.PI / 180);
              const x0 = 50 + 47 * Math.cos(a0);
              const y0 = 50 + 47 * Math.sin(a0);
              const x1 = 50 + 47 * Math.cos(a1);
              const y1 = 50 + 47 * Math.sin(a1);
              const mid = ((i + 0.5) * SEG_DEG - 90) * (Math.PI / 180);
              const tx = 50 + 32 * Math.cos(mid);
              const ty = 50 + 32 * Math.sin(mid);
              const big = prize >= 100;
              return (
                <g key={i}>
                  <path
                    d={`M50 50 L${x0} ${y0} A47 47 0 0 1 ${x1} ${y1} Z`}
                    fill={big ? "#56B947" : i % 2 ? "#F6F1E3" : "#E9E1CF"}
                    stroke="#17150F"
                    strokeWidth="1.6"
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#17150F"
                    fontFamily="ui-monospace, monospace"
                  >
                    {prize}
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="10" fill="#E9E1CF" stroke="#17150F" strokeWidth="1.6" />
          </motion.svg>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:items-start">
          {!hydrated ? (
            <p className="text-sm text-ink/45">Loading your spin.</p>
          ) : !connected ? (
            <p className="flex items-center gap-2 text-center text-sm text-ink/60 sm:text-left">
              <XLogo className="h-3 w-3 shrink-0" />
              Connect X on the allowlist page and your spin unlocks here.
            </p>
          ) : won !== null ? (
            <p role="status" className="text-center text-sm font-medium sm:text-left">
              <span className="font-mono text-lg font-bold">+{won}</span> points.
              Come back tomorrow for the next one.
            </p>
          ) : locked ? (
            <p className="text-center text-sm text-ink/60 sm:text-left">
              You have had your spin. The wheel opens again in{" "}
              <span className="font-mono font-bold tabular">
                {formatLeft(ready! - now)}
              </span>
              .
            </p>
          ) : (
            <p className="text-center text-sm text-ink/60 sm:text-left">
              One pull a day, straight onto your points total. Miss a day and you
              just miss that day.
            </p>
          )}

          <Button
            onClick={handleSpin}
            disabled={!hydrated || !connected || locked || spinning}
            loading={spinning}
            className="w-full sm:w-auto"
          >
            {spinning ? "Spinning" : locked ? "Come back later" : "Spin"}
          </Button>
        </div>
      </div>
    </div>
  );
}

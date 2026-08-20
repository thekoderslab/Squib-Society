"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { requestSpin } from "@/lib/api";
import { DAILY_SPIN } from "@/lib/constants";
import { formatCountdown, readyAt } from "@/lib/dates";
import { useProgress } from "@/state/progress";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import { XLogo } from "../funnel/icons";

const SEGMENTS = DAILY_SPIN.segments;
const SEG_DEG = 360 / SEGMENTS.length;

type Outcome = { points: number; gtd: boolean; again: boolean };

/**
 * One spin every 24 hours. Points on most segments, a guaranteed spot on one,
 * and two "again" wedges that pay nothing but do not spend the cooldown.
 *
 * // INTEGRATION: server-authoritative spin. requestSpin() decides the segment
 * and writes it before answering, so a reload or a replayed request cannot
 * produce a second prize. The wheel is only told where to stop.
 */
export default function DailySpin() {
  const { hydrated, progress, recordSpin, applyServerProgress } = useProgress();
  const reduce = useReducedMotion();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const connected = !!progress.x;
  const ready = readyAt(progress.lastSpinAt, DAILY_SPIN.cooldownHours);
  const locked = hydrated && ready !== null && ready > now;

  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  async function handleSpin() {
    if (spinning || locked || !connected) return;
    setSpinning(true);
    setOutcome(null);

    try {
      const res = await requestSpin();
      setRotation(
        (r) => r + 360 * 5 + ((360 - res.segment * SEG_DEG - SEG_DEG / 2) - (r % 360)),
      );

      window.setTimeout(
        () => {
          if (res.progress) applyServerProgress(res.progress);
          else if (!res.again) recordSpin(res.points, res.gtd);
          setOutcome({ points: res.points, gtd: res.gtd, again: res.again });
          setNow(Date.now());
          setSpinning(false);
        },
        reduce ? 150 : 3600,
      );
    } catch {
      setSpinning(false);
    }
  }

  const canSpin = hydrated && connected && !locked && !spinning;

  return (
    <div className="flex h-full flex-col border-2 border-hairline bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="stamp text-squib-deep">Daily spin</p>
        {locked ? (
          <Chip tone="neutral" className="tabular">
            {formatCountdown(ready! - now)}
          </Chip>
        ) : (
          <Chip tone="outline">Once a day</Chip>
        )}
      </div>

      {/* the wheel, centred and given room */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-full max-w-[340px]">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[5px]"
          >
            <svg viewBox="0 0 22 20" className="h-5 w-[22px]">
              <path d="M11 20 0 0h22L11 20Z" fill="#17150F" />
            </svg>
          </span>

          <motion.svg
            viewBox="0 0 100 100"
            className="w-full"
            aria-hidden
            animate={{ rotate: rotation }}
            transition={{ duration: reduce ? 0.15 : 3.6, ease: [0.16, 0.9, 0.25, 1] }}
          >
            {SEGMENTS.map((seg, i) => {
              const a0 = (i * SEG_DEG - 90) * (Math.PI / 180);
              const a1 = ((i + 1) * SEG_DEG - 90) * (Math.PI / 180);
              const x0 = 50 + 48 * Math.cos(a0);
              const y0 = 50 + 48 * Math.sin(a0);
              const x1 = 50 + 48 * Math.cos(a1);
              const y1 = 50 + 48 * Math.sin(a1);
              const mid = ((i + 0.5) * SEG_DEG - 90) * (Math.PI / 180);
              const tx = 50 + 33 * Math.cos(mid);
              const ty = 50 + 33 * Math.sin(mid);

              const fill =
                seg.kind === "gtd"
                  ? "#C1402E"
                  : seg.kind === "again"
                    ? "#D6CBB0"
                    : seg.points >= 100
                      ? "#56B947"
                      : i % 2
                        ? "#F6F1E3"
                        : "#E9E1CF";

              return (
                <g key={i}>
                  <path
                    d={`M50 50 L${x0} ${y0} A48 48 0 0 1 ${x1} ${y1} Z`}
                    fill={fill}
                    stroke="#17150F"
                    strokeWidth="1.4"
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={seg.kind === "points" ? "8" : "6"}
                    fontWeight="700"
                    fill={seg.kind === "gtd" ? "#F6F1E3" : "#17150F"}
                    fontFamily="ui-monospace, monospace"
                    transform={`rotate(${(i + 0.5) * SEG_DEG} ${tx} ${ty})`}
                  >
                    {seg.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
            <circle
              cx="50"
              cy="50"
              r="11"
              fill="#E9E1CF"
              stroke="#17150F"
              strokeWidth="1.6"
            />
          </motion.svg>
        </div>
      </div>

      {/* status line */}
      <div className="mt-6 min-h-[3.5rem] text-center">
        {!hydrated ? (
          <p className="text-sm text-ink/45">Loading your spin.</p>
        ) : !connected ? (
          <p className="inline-flex items-center gap-2 text-sm text-ink/60">
            <XLogo className="h-3 w-3 shrink-0" />
            Connect X on the allowlist page and your spin unlocks here.
          </p>
        ) : outcome ? (
          <p role="status" className="text-sm leading-relaxed">
            {outcome.again ? (
              <span className="font-medium">
                Try again. That one costs you nothing, the wheel is still open.
              </span>
            ) : outcome.gtd ? (
              <span className="font-medium text-flare">
                Guaranteed spot. That is the rarest wedge on the wheel and you
                just landed it.
              </span>
            ) : (
              <span>
                <span className="font-mono text-xl font-bold">
                  +{outcome.points}
                </span>{" "}
                points. Back again tomorrow.
              </span>
            )}
          </p>
        ) : locked ? (
          <p className="text-sm leading-relaxed text-ink/60">
            You have had your spin. The wheel opens again in{" "}
            <span className="font-mono font-bold tabular">
              {formatCountdown(ready! - now)}
            </span>
            .
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-ink/60">
            One pull a day. Most wedges pay points, one hands out a guaranteed
            spot, and two give you another go for free.
          </p>
        )}
      </div>

      {/* button, centred at the bottom */}
      <div className="mt-auto flex justify-center pt-5">
        <Button
          onClick={handleSpin}
          disabled={!canSpin}
          loading={spinning}
          size="lg"
          className="min-w-[200px]"
        >
          {spinning
            ? "Spinning"
            : outcome?.again
              ? "Spin again"
              : locked
                ? "Come back later"
                : "Spin"}
        </Button>
      </div>
    </div>
  );
}

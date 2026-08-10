"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { GTD_SPIN_ODDS } from "@/lib/constants";
import { requestSpin } from "@/lib/mock-api";
import { useProgress } from "@/state/progress";
import Button from "../ui/Button";

const SEGMENTS = 8;
const SEG_DEG = 360 / SEGMENTS;
/** Segment 0 is the guaranteed slice. The rest are "keep your spot". */
const WIN_SEGMENT = 0;

/**
 * The spin is framed as an upgrade on a spot you already hold, never as a
 * coin-flip on entry — nobody who finished the tasks can lose anything here.
 *
 * // INTEGRATION: GTD spin (server-authoritative). The result below arrives
 * from requestSpin(); the wheel is only told where to stop. Do not move the
 * odds into this file.
 */
export default function SpinWheel() {
  const { progress, recordSpin } = useProgress();
  const reduce = useReducedMotion();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [outcome, setOutcome] = useState<boolean | null>(null);

  const spent = progress.spinUsed;
  const settled = spent && !spinning;
  const shownOutcome = outcome ?? (spent ? progress.gtd : null);

  async function handleSpin() {
    if (spinning || spent) return;
    setSpinning(true);

    const res = await requestSpin();
    const target = res.upgraded
      ? WIN_SEGMENT
      : 1 + Math.floor(Math.random() * (SEGMENTS - 1));

    // land the pointer in the middle of the decided segment, after 5 turns
    const landing = 360 * 5 + (360 - target * SEG_DEG - SEG_DEG / 2);
    setRotation(landing);

    window.setTimeout(
      () => {
        recordSpin(res.upgraded);
        setOutcome(res.upgraded);
        setSpinning(false);
      },
      reduce ? 150 : 3400,
    );
  }

  return (
    <div className="rounded-squib border border-hairline bg-cream p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-display text-base font-semibold tracking-tight">
            Spin for a guaranteed spot
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            You already have your allowlist spot. This only adds to it.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-hairline bg-surface px-2.5 py-1 font-mono text-[11px] text-ink/60">
          {(GTD_SPIN_ODDS * 100).toFixed(1)}%
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-36 w-36 shrink-0">
          {/* pointer */}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          >
            <svg viewBox="0 0 16 14" className="h-3.5 w-4">
              <path d="M8 14 0 0h16L8 14Z" fill="#262019" />
            </svg>
          </span>

          <motion.svg
            viewBox="0 0 100 100"
            className="h-full w-full drop-shadow-sm"
            aria-hidden
            animate={{ rotate: rotation }}
            transition={{ duration: reduce ? 0.15 : 3.4, ease: [0.16, 0.9, 0.25, 1] }}
          >
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const a0 = (i * SEG_DEG - 90) * (Math.PI / 180);
              const a1 = ((i + 1) * SEG_DEG - 90) * (Math.PI / 180);
              const x0 = 50 + 48 * Math.cos(a0);
              const y0 = 50 + 48 * Math.sin(a0);
              const x1 = 50 + 48 * Math.cos(a1);
              const y1 = 50 + 48 * Math.sin(a1);
              return (
                <path
                  key={i}
                  d={`M50 50 L${x0} ${y0} A48 48 0 0 1 ${x1} ${y1} Z`}
                  fill={i === WIN_SEGMENT ? "#56B947" : i % 2 ? "#F4EFE6" : "#EDE6D9"}
                  stroke="#E7E0D3"
                  strokeWidth="0.6"
                />
              );
            })}
            <circle cx="50" cy="50" r="12" fill="#FBF8F2" stroke="#E7E0D3" />
          </motion.svg>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:items-start">
          {settled ? (
            <p
              role="status"
              className={`text-center text-sm font-medium sm:text-left ${
                shownOutcome ? "text-squib-deep" : "text-ink/60"
              }`}
            >
              {shownOutcome
                ? "Upgraded. You have a guaranteed spot — nothing else to do."
                : "Not this time. Your allowlist spot is untouched, and the leaderboard is still open."}
            </p>
          ) : (
            <p className="text-center text-sm text-ink/55 sm:text-left">
              One spin per account. Odds are fixed and decided on our side, not
              in your browser.
            </p>
          )}

          <Button
            onClick={handleSpin}
            disabled={spent || spinning}
            loading={spinning}
            className="w-full sm:w-auto"
          >
            {spinning ? "Spinning…" : spent ? "Spin used" : "Spin"}
          </Button>
        </div>
      </div>
    </div>
  );
}

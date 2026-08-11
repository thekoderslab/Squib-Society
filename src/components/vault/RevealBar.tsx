import { REVEAL_MILESTONES, TOTAL_SUPPLY } from "@/lib/constants";
import { formatNumber } from "@/lib/dates";
import type { RevealProgress } from "@/lib/types";

const GOAL = REVEAL_MILESTONES[REVEAL_MILESTONES.length - 1].allowlisted;

/**
 * Two numbers, one bar. The mono counter is how much of the collection is out
 * of the dark; the bar is how close the community is to opening more of it.
 * Tying reveals to milestones is what turns a hidden collection into a pull.
 */
export default function RevealBar({ progress }: { progress: RevealProgress }) {
  const pct = Math.min(100, (progress.allowlisted / GOAL) * 100);

  return (
    <div className="rounded-card border-2 border-hairline bg-surface p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="font-mono text-3xl font-bold tabular tracking-tight sm:text-4xl">
            {String(progress.revealed).padStart(3, "0")}
            <span className="text-ink/30"> / {TOTAL_SUPPLY}</span>
          </p>
          <p className="mt-1 text-sm text-ink/55">revealed</p>
        </div>

        <div className="text-right">
          <p className="font-mono text-xl font-bold tabular sm:text-2xl">
            {formatNumber(progress.allowlisted)}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            {progress.nextMilestone ? (
              <>
                allowlisted — next reveal at{" "}
                <span className="font-mono tabular text-ink/80">
                  {formatNumber(progress.nextMilestone.allowlisted)}
                </span>
              </>
            ) : (
              "allowlisted — every milestone cleared"
            )}
          </p>
        </div>
      </div>

      {/* the bar */}
      <div className="relative mt-7">
        <div
          className="h-3 w-full overflow-hidden rounded-none bg-locked/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-valuenow={progress.allowlisted}
          aria-label={`${formatNumber(progress.allowlisted)} of ${formatNumber(
            GOAL,
          )} allowlisted toward the final reveal`}
        >
          <div
            className="h-full rounded-none bg-squib transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* milestone markers */}
        <ul className="pointer-events-none absolute inset-x-0 top-0">
          {REVEAL_MILESTONES.map((m) => {
            const left = (m.allowlisted / GOAL) * 100;
            const reached = progress.allowlisted >= m.allowlisted;
            const isNext = progress.nextMilestone?.allowlisted === m.allowlisted;
            return (
              <li
                key={m.allowlisted}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className={`block h-3 w-[3px] rounded-none ${
                    reached ? "bg-white/70" : isNext ? "bg-ink/70" : "bg-ink/25"
                  }`}
                  aria-hidden
                />
                <span
                  className={`mt-2 block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] ${
                    isNext ? "text-ink/80" : "text-ink/40"
                  } ${isNext ? "" : "hidden sm:block"}`}
                  style={{
                    transform:
                      left > 90 ? "translateX(-38%)" : left < 12 ? "translateX(18%)" : undefined,
                  }}
                >
                  {formatNumber(m.allowlisted)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-14 text-sm leading-relaxed text-ink/55 sm:mt-12">
        Reveals are earned, not scheduled. Every squib you see below came out of
        the vault because the allowlist hit a number.{" "}
        {progress.nextMilestone ? (
          <span className="text-ink/75">
            {formatNumber(
              progress.nextMilestone.allowlisted - progress.allowlisted,
            )}{" "}
            more of you and{" "}
            {progress.nextMilestone.reveals - progress.revealed} more open up.
          </span>
        ) : null}
      </p>
    </div>
  );
}

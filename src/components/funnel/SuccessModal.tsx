"use client";

import { buildShareIntent, earn } from "@/lib/api";
import { POINTS, WL_WINNERS } from "@/lib/constants";
import { localDayKey } from "@/lib/dates";
import type { SubmitResult } from "@/lib/types";
import { useProgress } from "@/state/progress";
import SquibHead from "../art/SquibHead";
import { LinkButton } from "../ui/Button";
import Modal, { ModalClose } from "../ui/Modal";
import SpinWheel from "./SpinWheel";

export default function SuccessModal({
  open,
  onClose,
  result,
}: {
  open: boolean;
  onClose: () => void;
  result: SubmitResult | null;
}) {
  const { progress, applyServerProgress } = useProgress();
  const rank = result?.rank ?? null;

  // The share bonus is credited when they open the intent. Verifying that the
  // post actually happened is the least reliable check of the four, which is
  // exactly why this is a bonus and not a gate.
  async function creditShare() {
    const { progress: server } = await earn("share", { day: localDayKey() });
    if (server) applyServerProgress(server);
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="wl-success-title" className="max-w-xl">
      <div className="max-h-[86vh] overflow-y-auto p-6 sm:p-8">
        <ModalClose onClose={onClose} />

        <div className="flex items-center gap-4">
          <SquibHead size={160} className="h-20 w-20 shrink-0 animate-bob" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-squib-deep">
              Allowlisted
            </p>
            <h3
              id="wl-success-title"
              className="mt-1 font-display text-3xl font-semibold tracking-tightest"
            >
              You&apos;re in.
            </h3>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-squib border border-hairline bg-cream px-4 py-3">
            <dt className="text-xs text-ink/50">Your rank</dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular">
              {rank ? `#${rank}` : "—"}
            </dd>
          </div>
          <div className="rounded-squib border border-hairline bg-cream px-4 py-3">
            <dt className="text-xs text-ink/50">Points</dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular">
              {progress.points}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm leading-relaxed text-ink/60 text-pretty">
          Your spot is locked to that address. To move up, come back tomorrow —
          the check-in streak is worth more than anything you can do in one
          sitting, and the top {WL_WINNERS} at snapshot get guaranteed spots.
        </p>

        <div className="mt-5">
          <LinkButton
            href={buildShareIntent(rank)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={creditShare}
            size="lg"
            className="w-full"
          >
            {/* INTEGRATION: share intent (pre-filled quote tweet) */}
            Share to earn +{POINTS.quote}
          </LinkButton>
        </div>

        <div className="mt-6 border-t border-hairline pt-6">
          <SpinWheel />
        </div>
      </div>
    </Modal>
  );
}

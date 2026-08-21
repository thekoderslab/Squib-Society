"use client";

import Link from "next/link";

import { buildShareIntent, earn } from "@/lib/api";
import { POINTS } from "@/lib/constants";
import { localDayKey } from "@/lib/dates";
import type { SubmitResult } from "@/lib/types";
import { useProgress } from "@/state/progress";
import SquibHead from "../art/SquibHead";
import { LinkButton } from "../ui/Button";
import Modal, { ModalClose } from "../ui/Modal";

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
  // result only exists right after a submit. Reopening from "Open your
  // spot" has none, which is why this used to render a placeholder.
  const rank = result?.rank ?? progress.rank;

  // The share bonus lands when they open the intent. Checking that the post
  // actually happened is the least reliable of the four checks, which is why
  // this is a bonus and not a gate.
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
            <p className="stamp text-squib-deep">You&apos;re in</p>
            <h3
              id="wl-success-title"
              className="mt-2 font-display text-3xl font-bold tracking-tightest"
            >
              That&apos;s your spot.
            </h3>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px border-2 border-hairline bg-hairline">
          <div className="bg-cream px-4 py-3">
            <dt className="stamp text-ink/50">Your place</dt>
            <dd className="mt-1.5 font-mono text-2xl font-bold tabular">
              {rank ? `#${rank}` : "Counting"}
            </dd>
          </div>
          <div className="bg-cream px-4 py-3">
            <dt className="stamp text-ink/50">Points</dt>
            <dd className="mt-1.5 font-mono text-2xl font-bold tabular">
              {progress.points}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm leading-relaxed text-ink/65 text-pretty">
          Your spot is tied to that address. If you want to move up the board,
          come back tomorrow and take your spin. That is worth far more over a
          few weeks than anything you can do in one sitting.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <LinkButton
            href={buildShareIntent(rank)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={creditShare}
            size="lg"
          >
            {/* INTEGRATION: share intent (pre-filled quote tweet) */}
            Share for +{POINTS.quote}
          </LinkButton>
          <LinkButton href="/leaderboard" variant="ghost" size="lg">
            See the board
          </LinkButton>
        </div>

        <p className="mt-4 text-center text-xs text-ink/45">
          <Link href="/roadmap" className="underline underline-offset-4">
            What happens next
          </Link>
        </p>
      </div>
    </Modal>
  );
}

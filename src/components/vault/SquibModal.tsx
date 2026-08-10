"use client";

import { useEffect, useRef } from "react";

import { TOTAL_SUPPLY } from "@/lib/constants";
import type { Squib } from "@/lib/types";
import SquibImage from "../art/SquibImage";
import Modal, { ModalClose } from "../ui/Modal";

export default function SquibModal({
  squib,
  onClose,
}: {
  squib: Squib | null;
  onClose: () => void;
}) {
  // Hold the last squib through the close animation so the panel doesn't
  // blank out mid-transition.
  const last = useRef<Squib | null>(null);
  useEffect(() => {
    if (squib) last.current = squib;
  }, [squib]);
  const shown = squib ?? last.current;

  return (
    <Modal open={!!squib} onClose={onClose} labelledBy="squib-modal-title">
      {shown ? (
        <div className="p-6 sm:p-8">
          <ModalClose onClose={onClose} />

          <div className="studio-grain relative overflow-hidden rounded-squib border border-hairline bg-cream px-6 pt-6">
            <SquibImage
              squib={shown}
              className="relative z-10 mx-auto h-auto w-[62%] max-w-[220px]"
            />
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/45">
            #{String(shown.id).padStart(4, "0")} / {TOTAL_SUPPLY}
          </p>

          <h3
            id="squib-modal-title"
            className="mt-2 font-display text-3xl font-semibold tracking-tightest"
          >
            {shown.name}
          </h3>

          <p className="mt-1 text-sm font-medium text-squib-deep">{shown.role}</p>

          <p className="mt-4 text-[15px] leading-relaxed text-ink/70 text-pretty">
            {shown.bio}
          </p>
        </div>
      ) : (
        <div className="p-6" />
      )}
    </Modal>
  );
}

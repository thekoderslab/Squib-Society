"use client";

import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { TOTAL_SUPPLY } from "@/lib/constants";
import { getVaultMap } from "@/lib/mock-api";
import type { Squib } from "@/lib/types";
import LockedSquib, { LockedSquibDefs } from "../art/LockedSquib";
import SquibImage from "../art/SquibImage";
import SquibModal from "./SquibModal";

const TILE_COUNT = TOTAL_SUPPLY;

export default function VaultGrid() {
  const vault = useMemo(() => getVaultMap(), []);
  const [selected, setSelected] = useState<Squib | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  /**
   * One delegated handler and one tooltip node for all 360 locked tiles.
   * Per-tile listeners and per-tile tooltips would put ~1,000 extra nodes on
   * the page for a hover hint.
   */
  const hovered = useRef<Element | null>(null);

  const onGridMove = useCallback((e: MouseEvent<HTMLUListElement>) => {
    const el = (e.target as HTMLElement).closest("[data-locked]");
    if (el === hovered.current) return; // same tile — nothing to update
    hovered.current = el;
    if (!el) {
      setTip(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top });
  }, []);

  const locked = TILE_COUNT - vault.size;

  return (
    <>
      <LockedSquibDefs />

      <p className="sr-only">
        {vault.size} of {TILE_COUNT} squibs are revealed. The remaining {locked}{" "}
        are locked and unlock at community milestones.
      </p>

      <ul
        onMouseMove={onGridMove}
        onMouseLeave={() => {
          hovered.current = null;
          setTip(null);
        }}
        className="grid grid-cols-9 gap-1.5 sm:grid-cols-12 sm:gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))] lg:grid-cols-[repeat(21,minmax(0,1fr))]"
      >
        {Array.from({ length: TILE_COUNT }, (_, i) => {
          const squib = vault.get(i);
          return squib ? (
            <RevealedTile key={i} squib={squib} onOpen={setSelected} />
          ) : (
            <LockedTile key={i} />
          );
        })}
      </ul>

      {/* single floating tooltip, positioned over whichever locked tile is hovered */}
      {tip ? (
        <div
          role="presentation"
          className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-full rounded-full border border-hairline bg-ink px-3 py-1.5 text-xs font-medium text-cream shadow-lift"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          Locked — reveal soon
        </div>
      ) : null}

      <SquibModal squib={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const LockedTile = memo(function LockedTile() {
  return (
    <li
      data-locked
      aria-hidden
      className="group relative aspect-square overflow-hidden rounded-lg bg-locked/70 ring-1 ring-inset ring-hairline transition-colors duration-200 hover:bg-locked sm:rounded-xl"
    >
      <LockedSquib className="absolute inset-[14%] h-auto w-[72%] text-ink/[0.13] transition-transform group-hover:animate-shiver" />
      <span
        className="absolute inset-0 grid place-items-center font-mono text-[10px] font-bold text-ink/35 sm:text-xs"
        aria-hidden
      >
        ?
      </span>
    </li>
  );
});

const RevealedTile = memo(function RevealedTile({
  squib,
  onOpen,
}: {
  squib: Squib;
  onOpen: (s: Squib) => void;
}) {
  return (
    <li className="relative aspect-square">
      <button
        type="button"
        onClick={() => onOpen(squib)}
        className="group relative block h-full w-full overflow-hidden rounded-lg border border-hairline bg-surface shadow-card outline-offset-2 transition-transform duration-300 will-change-transform hover:-translate-y-1 hover:rotate-[-2.5deg] hover:shadow-lift sm:rounded-xl"
      >
        <span className="sr-only">
          {squib.name}, the {squib.role.toLowerCase()}. Open details.
        </span>
        <SquibImage
          squib={squib}
          className="h-full w-full object-contain p-[6%] transition-transform duration-300 group-hover:scale-[1.06]"
        />
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-surface via-surface/85 to-transparent pb-1 pt-3 text-center font-mono text-[9px] text-ink/55 md:block"
          aria-hidden
        >
          {String(squib.id).padStart(4, "0")}
        </span>
      </button>
    </li>
  );
});

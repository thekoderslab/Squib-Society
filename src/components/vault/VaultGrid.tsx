"use client";

import Link from "next/link";
import { memo, useCallback, useMemo, useRef, useState, type MouseEvent } from "react";

import { TOTAL_SUPPLY } from "@/lib/constants";
import { getVaultMap } from "@/lib/mock-api";
import type { Squib } from "@/lib/types";
import LockedSquib, { LockedSquibDefs } from "../art/LockedSquib";
import SquibPhoto from "../art/SquibPhoto";

const TILE_COUNT = TOTAL_SUPPLY;

export default function VaultGrid() {
  const vault = useMemo(() => getVaultMap(), []);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const hovered = useRef<Element | null>(null);

  /**
   * One delegated handler and one tooltip node for all 359 locked tiles.
   * Per-tile listeners and per-tile tooltips would add roughly a thousand
   * nodes to the page for a hover hint.
   */
  const onGridMove = useCallback((e: MouseEvent<HTMLUListElement>) => {
    const el = (e.target as HTMLElement).closest("[data-locked]");
    if (el === hovered.current) return;
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
        {vault.size} of {TILE_COUNT} squibs are revealed. The remaining {locked} are
        locked and open at community milestones.
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
            <RevealedTile key={i} squib={squib} />
          ) : (
            <LockedTile key={i} />
          );
        })}
      </ul>

      {tip ? (
        <div
          role="presentation"
          className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-full rounded-none border-2 border-hairline bg-ink px-3 py-1.5 text-xs font-medium text-cream shadow-lift"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          Locked — reveal soon
        </div>
      ) : null}
    </>
  );
}

const LockedTile = memo(function LockedTile() {
  return (
    <li
      data-locked
      aria-hidden
      className="group relative aspect-square overflow-hidden rounded-none bg-locked/70 ring-1 ring-inset ring-ink/25 transition-colors duration-200 hover:bg-locked sm:rounded-none"
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

const RevealedTile = memo(function RevealedTile({ squib }: { squib: Squib }) {
  return (
    <li className="relative aspect-square">
      <Link
        href={`/squib/${String(squib.id).padStart(4, "0")}`}
        className="group relative block h-full w-full overflow-hidden rounded-none border-2 border-hairline bg-surface shadow-card outline-offset-2 transition-transform duration-300 will-change-transform hover:-translate-y-1 hover:rotate-[-2.5deg] hover:shadow-lift sm:rounded-none"
      >
        <span className="sr-only">
          {squib.name}, the {squib.role.toLowerCase()}
        </span>
        <SquibPhoto
          squib={squib}
          sizes="(max-width: 640px) 12vw, (max-width: 1024px) 8vw, 60px"
          className="h-full w-full scale-[1.35] object-cover transition-transform duration-300 group-hover:scale-[1.45]"
        />
      </Link>
    </li>
  );
});

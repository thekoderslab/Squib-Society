"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SQUIBS } from "@/lib/mock-api";
import SquibPhoto from "./art/SquibPhoto";

const SLIDE_MS = 5000;

/**
 * The hero slider. Advances on its own, stops the moment you touch it, and
 * stays stopped. Nothing on the slide is numbered.
 */
export default function SquibSlider() {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);

  const go = useCallback((next: number) => {
    setHeld(true);
    setI((next + SQUIBS.length) % SQUIBS.length);
  }, []);

  useEffect(() => {
    if (held) return;
    const t = window.setInterval(
      () => setI((v) => (v + 1) % SQUIBS.length),
      SLIDE_MS,
    );
    return () => window.clearInterval(t);
  }, [held]);

  const squib = SQUIBS[i];

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* flex-1 + object-cover: the column is as tall as the copy beside it, and
          any spare height goes to the picture instead of pooling underneath. */}
      <div className="relative min-h-[340px] flex-1">
        {/* All slides stay mounted so the browser keeps them decoded and the
            change is instant rather than a flash of empty frame. */}
        {SQUIBS.map((s, index) => (
          <div
            key={s.slug}
            aria-hidden={index !== i}
            className={index === i ? "absolute inset-0" : "hidden"}
          >
            <SquibPhoto
              squib={s}
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 560px"
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="Previous squib"
          className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border-2 border-hairline bg-cream font-display text-lg shadow-card transition hover:bg-ink hover:text-cream"
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="Next squib"
          className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border-2 border-hairline bg-cream font-display text-lg shadow-card transition hover:bg-ink hover:text-cream"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-hairline px-5 py-3">
        <Link href={`/squib/${squib.slug}`} className="group min-w-0">
          <span className="block font-display text-lg font-bold leading-tight group-hover:underline">
            {squib.name}
          </span>
          <span className="block truncate text-sm text-ink/55">{squib.role}</span>
        </Link>

        <ul className="flex shrink-0 items-center gap-1.5" aria-label="Choose a squib">
          {SQUIBS.map((s, index) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => go(index)}
                aria-label={s.name}
                aria-current={index === i ? "true" : undefined}
                className={`block h-2.5 w-2.5 border-2 border-hairline transition-colors ${
                  index === i ? "bg-squib" : "bg-cream hover:bg-locked"
                }`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

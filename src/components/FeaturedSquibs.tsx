import Link from "next/link";

import { REVEALED_SQUIBS } from "@/lib/mock-api";
import SquibPhoto from "./art/SquibPhoto";
import Reveal from "./ui/Reveal";

/** Six of the ten that are out, shown large. The gallery, not a thumbnail row. */
const PICKS = [52, 184, 80, 368, 63, 355];

export default function FeaturedSquibs() {
  const squibs = PICKS.map((id) => REVEALED_SQUIBS.find((s) => s.id === id)!).filter(
    Boolean,
  );

  return (
    <section className="border-t-2 border-hairline py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-squib-deep">
                Out of the vault
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.04] tracking-tightest text-balance sm:text-5xl">
                Ten are out. The other 359 are still in the dark.
              </h2>
            </div>
            <Link
              href="/vault"
              className="rounded-none border-2 border-hairline bg-surface px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
            >
              See all 369
            </Link>
          </div>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squibs.map((squib, i) => (
            <Reveal as="li" key={squib.id} delay={i * 0.05}>
              <Link
                href={`/squib/${String(squib.id).padStart(4, "0")}`}
                className="group block overflow-hidden rounded-card border-2 border-hairline bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="overflow-hidden">
                  <SquibPhoto
                    squib={squib}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 360px"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-end justify-between gap-3 border-t-2 border-hairline px-5 py-4">
                  <div>
                    <p className="font-display text-lg font-semibold tracking-tight">
                      {squib.name}
                    </p>
                    <p className="text-sm text-ink/55">{squib.role}</p>
                  </div>
                  <p className="font-mono text-xs text-ink/40">
                    #{String(squib.id).padStart(4, "0")}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

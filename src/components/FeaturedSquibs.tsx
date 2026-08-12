import Link from "next/link";

import { SQUIBS } from "@/lib/mock-api";
import SquibPhoto from "./art/SquibPhoto";
import Reveal from "./ui/Reveal";

/** Six of the ones we've shown so far. */
const PICKS = [
  "fox-winter",
  "lotus",
  "warden",
  "paper-planet",
  "sprite",
  "drifter",
];

export default function FeaturedSquibs() {
  const squibs = PICKS.map((slug) => SQUIBS.find((s) => s.slug === slug)!).filter(
    Boolean,
  );

  return (
    <section className="border-t-2 border-hairline py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-xl">
            <p className="stamp text-squib-deep">A few of them</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-[1.02] tracking-tightest text-balance sm:text-5xl">
              Say hello to some of the squibs.
            </h2>
          </div>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squibs.map((squib, i) => (
            <Reveal as="li" key={squib.slug} delay={i * 0.05}>
              <Link
                href={`/squib/${squib.slug}`}
                className="group block overflow-hidden border-2 border-hairline bg-surface shadow-card transition duration-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift"
              >
                <div className="overflow-hidden">
                  <SquibPhoto
                    squib={squib}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 360px"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="border-t-2 border-hairline px-5 py-4">
                  <p className="font-display text-lg font-bold leading-tight">
                    {squib.name}
                  </p>
                  <p className="text-sm text-ink/55">{squib.role}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

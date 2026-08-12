import Link from "next/link";

import FeaturedSquibs from "@/components/FeaturedSquibs";
import Hero from "@/components/Hero";
import { LinkButton } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { MINT_VENUE } from "@/lib/constants";

const STEPS = [
  {
    n: "01",
    title: "Do three small things",
    body: "Follow, like, repost. That is the whole gate. Finish those and you are on the list, no draw and no cut.",
    href: "/allowlist",
    cta: "Start now",
  },
  {
    n: "02",
    title: "Come back and climb",
    body: "Spin once a day, play the game, keep your points moving. The people at the top of the leaderboard get guaranteed spots.",
    href: "/leaderboard",
    cta: "See the board",
  },
  {
    n: "03",
    title: `Mint on ${MINT_VENUE}`,
    body: `Minting happens on ${MINT_VENUE}, not here. Allowlist goes first. There may never be a public round at all.`,
    href: "/roadmap",
    cta: "Read the plan",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedSquibs />

      <section className="border-t-2 border-hairline py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-[1.02] tracking-tightest text-balance sm:text-5xl">
              How you get one.
            </h2>
          </Reveal>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.06}>
                <div className="flex h-full flex-col border-2 border-hairline bg-surface p-6 shadow-card">
                  <span className="font-mono text-xs font-bold text-ink/30">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl font-bold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60 text-pretty">
                    {s.body}
                  </p>
                  <Link
                    href={s.href}
                    className="mt-auto pt-5 font-display text-xs font-semibold uppercase tracking-wide text-squib-deep underline underline-offset-4"
                  >
                    {s.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-2 border-hairline bg-squib-wash p-7 shadow-card sm:p-10">
              <div className="max-w-md">
                <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Finish the tasks and you are on the list.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  That part is not a competition. The leaderboard is only there to
                  decide who gets a guaranteed spot on top of it.
                </p>
              </div>
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
